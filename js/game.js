// ============================================================================
// Come In, Velvet! — Main Game Engine, Loop, HUD & Event Orchestration
// ============================================================================

class ComeInVelvetGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.level = new window.MansionLevel();
    this.velvet = new window.Entities.VelvetPlayer(360, 618);
    this.ui = new window.UIController(this);

    this.state = 'title'; // 'title' | 'playing' | 'victory' | 'gameover'
    this.animTime = 0;
    this.lastTimestamp = performance.now();

    // Night clock & progression (9:00 PM -> 12:00 AM = 165 seconds)
    this.nightDuration = 165;
    this.nightElapsed = 0;
    this.currentHourIndex = 0; // 0 = 9PM, 1 = 10PM, 2 = 11PM

    // Gameplay metrics
    this.partyControl = 100;
    this.score = 0;
    this.combo = 1;
    this.stats = {
      invitedAdmitted: 0,
      crashersCaught: 0,
      crashersEscaped: 0,
      falseAccusations: 0,
      slippedThroughDoor: 0
    };

    // World collections
    this.guests = [];
    this.candies = [];
    this.particles = [];
    this.floatingTexts = [];

    // Timers
    this.doorSpawnTimer = 2.0;
    this.sneakSpawnTimer = 22.0;
    this.windowAlertTimer = 0;
    this.atticAlertTimer = 0;
    this.bannerText = '';
    this.bannerSub = '';
    this.bannerTimer = 0;
    this.screenShake = 0;

    // Input state
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false
    };

    this.setupInputs();
    this.seedTitleDemo();
    requestAnimationFrame(ts => this.loop(ts));
  }

  seedTitleDemo() {
    this.guests = [];
    for (let i = 0; i < 4; i++) {
      const profile = window.GameData.generateDoorGuest(0);
      const g = new window.Entities.GuestEntity(profile, 420 + i * 165, 618, 'party');
      this.guests.push(g);
    }
  }

  startNewNight() {
    window.SFX.init();
    window.SFX.startMusic();

    this.state = 'playing';
    this.velvet = new window.Entities.VelvetPlayer(330, 618);
    this.nightElapsed = 0;
    this.currentHourIndex = 0;

    this.partyControl = 100;
    this.score = 0;
    this.combo = 1;
    this.stats = {
      invitedAdmitted: 0,
      crashersCaught: 0,
      crashersEscaped: 0,
      falseAccusations: 0,
      slippedThroughDoor: 0
    };

    this.guests = [];
    this.candies = [];
    this.particles = [];
    this.floatingTexts = [];

    this.doorSpawnTimer = 1.5;
    this.sneakSpawnTimer = 20.0;
    this.windowAlertTimer = 0;
    this.atticAlertTimer = 0;

    this.ui.closeQuestionModal();
    this.ui.updateGuestbookContent(0);
    this.showBanner('🕘 9:00 PM — DOORS OPEN!', 'Password: "BLOOD MOON" • No Muddy Swamp Boots!', 4.2);

    // Spawn first guest at the door right away
    this.spawnDoorGuest();
  }

  showBanner(title, subtitle, duration = 3.5) {
    this.bannerText = title;
    this.bannerSub = subtitle;
    this.bannerTimer = duration;
  }

  addFloatingText(text, x, y, color = '#ffd15c') {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -48,
      color,
      life: 1.35,
      maxLife: 1.35
    });
  }

  getHourIndex() {
    const progress = this.nightElapsed / this.nightDuration;
    if (progress < 0.333) return 0; // 9 PM
    if (progress < 0.666) return 1; // 10 PM
    return 2; // 11 PM
  }

  getTimeString() {
    const progress = Math.min(1, this.nightElapsed / this.nightDuration);
    const totalMinutes = Math.floor(progress * 180); // 180 mins from 9:00 PM to 12:00 AM
    if (totalMinutes >= 180) return '12:00 AM';
    const hour = 9 + Math.floor(totalMinutes / 60);
    const min = totalMinutes % 60;
    const minStr = min < 10 ? `0${min}` : `${min}`;
    return `${hour}:${minStr} PM`;
  }

  getQueueGuests() {
    return this.guests.filter(g => g.state === 'queue');
  }

  getActiveCrashers() {
    return this.guests.filter(g => g.state === 'fleeing' || g.state === 'sneaking');
  }

  spawnDoorGuest() {
    const queue = this.getQueueGuests();
    if (queue.length >= 3) return;

    const profile = window.GameData.generateDoorGuest(this.getHourIndex());
    const spawnX = 24 - queue.length * 46;
    const guest = new window.Entities.GuestEntity(profile, spawnX, 618, 'queue');
    this.guests.push(guest);
    window.SFX.doorbell();
  }

  spawnSneakyCrasher() {
    const activeCrashers = this.getActiveCrashers();
    if (activeCrashers.length >= 3) return;

    const hourIdx = this.getHourIndex();
    const profile = window.GameData.generateDoorGuest(hourIdx);
    profile.isInvited = false;

    const fromAttic = hourIdx >= 2 && Math.random() < 0.45;
    const spawnX = fromAttic ? this.level.atticPortal.x : this.level.windowEntry.x;
    const spawnY = fromAttic ? this.level.atticPortal.y : this.level.windowEntry.y;

    const crasher = new window.Entities.GuestEntity(profile, spawnX, spawnY, 'sneaking');
    crasher.say(fromAttic ? 'Hehe! Down the chimney!' : 'Sneaking through the window!', 3.2);
    this.guests.push(crasher);

    if (fromAttic) {
      this.atticAlertTimer = 3.5;
      this.addFloatingText('⚠️ ATTIC SNEAK!', spawnX - 40, spawnY - 30, '#ff3b5c');
    } else {
      this.windowAlertTimer = 3.5;
      this.addFloatingText('⚠️ WINDOW CRASHER!', spawnX - 50, spawnY - 30, '#ff3b5c');
    }
    window.SFX.alarmChase();
  }

  spawnCandy(x, y) {
    if (this.candies.length > 8) return;
    this.candies.push({
      x,
      y,
      vy: -160,
      baseY: y,
      life: 14
    });
  }

  tryInteractAtDoor() {
    if (this.state !== 'playing') return;
    if (this.ui.isModalOpen()) {
      this.ui.closeQuestionModal();
      return;
    }

    const queue = this.getQueueGuests();
    if (queue.length === 0) return;

    const frontGuest = queue[0];
    const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
    if (distToDoor <= 115) {
      this.ui.openQuestionModal(frontGuest, this.getHourIndex(), this.getTimeString());
    }
  }

  resolveDoorGuest(admitVerdict) {
    const guest = this.ui.activeGuest;
    if (!guest) return;
    this.ui.closeQuestionModal();

    if (admitVerdict) {
      // Player clicked "✅ Come In!"
      if (guest.isInvited) {
        // Correct! Invited guest enters the party
        guest.state = 'party';
        guest.x = 305;
        guest.y = 618;
        guest.say('Yay! Happy Halloween, Velvet!', 2.8);

        this.stats.invitedAdmitted++;
        const pts = 150 * this.combo;
        this.score += pts;
        this.combo = Math.min(5, this.combo + 1);
        this.partyControl = Math.min(100, this.partyControl + 6);

        window.SFX.admitSuccess();
        this.addFloatingText(`+Invited Guest! +${pts}`, guest.x, guest.y - 36, '#38f2af');
        this.spawnCandy(guest.x + 35, guest.y - 10);
      } else {
        // Mistake! Let an uninvited crasher into the mansion!
        guest.state = 'fleeing';
        guest.x = 320;
        guest.y = 618;
        guest.vy = -420;
        guest.say('Bahaha! Sucker! I\'m crashing this party!', 3.4);

        this.stats.slippedThroughDoor++;
        this.combo = 1;
        this.partyControl = Math.max(0, this.partyControl - 9);
        this.screenShake = 0.28;

        window.SFX.admitMistake();
        this.addFloatingText('⚠️ UNINVITED LET IN! CATCH THEM!', guest.x + 40, guest.y - 42, '#ff3b5c');
      }
    } else {
      // Player clicked "🚨 Uninvited!"
      if (!guest.isInvited) {
        // Spot on! Uninvited guest panics and bolts into the mansion platforms — chase them!
        guest.state = 'fleeing';
        guest.x = 315;
        guest.y = 618;
        guest.vy = -520;
        guest.targetX = 820;
        guest.say('EEK! My disguise failed! Run for it!', 3.2);

        const pts = 100 * this.combo;
        this.score += pts;
        window.SFX.alarmChase();
        this.addFloatingText(`🕵️ SPOTTED CRASHER! +${pts} — CATCH 'EM!`, guest.x + 45, guest.y - 42, '#ffd15c');
      } else {
        // False accusation! Real VIP guest was turned away
        const idx = this.guests.indexOf(guest);
        if (idx !== -1) this.guests.splice(idx, 1);

        this.stats.falseAccusations++;
        this.combo = 1;
        this.partyControl = Math.max(0, this.partyControl - 10);
        this.screenShake = 0.25;

        window.SFX.admitMistake();
        this.addFloatingText('❌ RUDE! That was an Invited VIP! (-10% Control)', 270, 555, '#ff3b5c');
      }
    }
  }

  tryCatchCrashers() {
    let caughtAny = false;
    const catchRange = this.velvet.isBat || this.velvet.swoopTimer > 0 ? 58 : 48;

    for (let i = this.guests.length - 1; i >= 0; i--) {
      const g = this.guests[i];
      if (g.state !== 'fleeing' && g.state !== 'sneaking') continue;

      const dist = Math.hypot(this.velvet.x - g.x, this.velvet.y - g.y);
      if (dist <= catchRange) {
        caughtAny = true;
        this.banishCrasher(g, i);
      }
    }
    return caughtAny;
  }

  banishCrasher(g, index) {
    this.guests.splice(index, 1);
    this.stats.crashersCaught++;

    const pts = 250 * this.combo;
    this.score += pts;
    this.combo = Math.min(5, this.combo + 1);
    this.partyControl = Math.min(100, this.partyControl + 8);
    this.screenShake = 0.22;

    window.SFX.catchCrasher();
    this.addFloatingText(`🎃 CRASHER YEETED! +${pts}`, g.x, g.y - 28, '#38f2af');
    this.spawnCandy(g.x, g.y);

    // Burst of celebratory pumpkin-gold & mint particles
    for (let p = 0; p < 22; p++) {
      const ang = (Math.PI * 2 * p) / 22;
      const spd = 70 + Math.random() * 150;
      this.particles.push({
        x: g.x,
        y: g.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4 + Math.random() * 5,
        color: p % 2 === 0 ? '#38f2af' : '#ffd15c',
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.65
      });
    }
  }

  handleCrasherEscape(crasher) {
    const idx = this.guests.indexOf(crasher);
    if (idx !== -1) this.guests.splice(idx, 1);

    this.stats.crashersEscaped++;
    this.combo = 1;
    this.partyControl = Math.max(0, this.partyControl - 14);
    this.screenShake = 0.35;

    window.SFX.crasherEscaped();
    this.addFloatingText('💨 CRASHER WRECKED THE ATTIC! (-14% Control)', crasher.x, crasher.y - 20, '#ff3b5c');
  }

  setupInputs() {
    window.addEventListener('keydown', e => {
      const code = e.code;

      if (this.state === 'title') {
        if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          this.startNewNight();
        }
        return;
      }

      if (this.state === 'victory' || this.state === 'gameover') {
        if (code === 'Space' || code === 'Enter' || code === 'KeyR') {
          e.preventDefault();
          this.startNewNight();
        }
        return;
      }

      // Global hotkeys
      if (code === 'KeyM') {
        this.ui.btnMute.click();
        return;
      }
      if (code === 'KeyR' && !this.ui.isModalOpen()) {
        this.startNewNight();
        return;
      }
      if (code === 'Tab' || code === 'KeyG') {
        e.preventDefault();
        this.ui.toggleGuestbook();
        return;
      }

      // If Question Modal is open, handle step-by-step interrogation shortcuts
      if (this.ui.isModalOpen()) {
        if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          this.ui.advanceStep();
        } else if (code === 'Digit1') {
          this.ui.askQuestion('id');
        } else if (code === 'Digit2') {
          this.ui.askQuestion('pass');
        } else if (code === 'Digit3') {
          this.ui.askQuestion('inspect');
        } else if (code === 'KeyR') {
          this.ui.btnPeekRules.click();
        } else if (code === 'KeyF') {
          this.resolveDoorGuest(true);
        } else if (code === 'KeyX') {
          this.resolveDoorGuest(false);
        } else if (code === 'Escape' || code === 'KeyE') {
          this.ui.closeQuestionModal();
        }
        return;
      }

      // Movement & Action Controls
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;
      if (code === 'KeyW' || code === 'ArrowUp') {
        if (!this.input.up && !this.velvet.isBat) {
          this.velvet.jump(this.particles);
        }
        this.input.up = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = true;

      if (code === 'Space') {
        e.preventDefault();
        this.velvet.jump(this.particles);
      }

      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyK') {
        e.preventDefault();
        const ok = this.velvet.toggleBatForm(this.particles);
        if (!ok) {
          this.addFloatingText('Need Bat Energy! Collect Soul Candy!', this.velvet.x, this.velvet.y - 30, '#ff8c3b');
        }
      }

      if (code === 'KeyJ' || code === 'KeyZ') {
        this.velvet.triggerSwoop(this.particles);
        this.tryCatchCrashers();
      }

      if (code === 'KeyE') {
        // First check if a crasher is right next to Velvet; otherwise interact with door
        if (!this.tryCatchCrashers()) {
          this.tryInteractAtDoor();
        }
      }
    });

    window.addEventListener('keyup', e => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.down = false;
    });

    // Canvas Mouse Click support (Start game, Question Door Guest, or Swoop Dash toward click!)
    this.canvas.addEventListener('mousedown', e => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (this.state === 'title' || this.state === 'victory' || this.state === 'gameover') {
        this.startNewNight();
        return;
      }

      if (this.ui.isModalOpen()) return;

      // Check if clicking near the Front Door queue guest
      const queue = this.getQueueGuests();
      if (queue.length > 0 && mx < 285 && my > 520) {
        const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
        if (distToDoor <= 140) {
          this.ui.openQuestionModal(queue[0], this.getHourIndex(), this.getTimeString());
          return;
        }
      }

      // Otherwise trigger Sonic Swoop toward mouse click!
      this.velvet.facing = mx >= this.velvet.x ? 1 : -1;
      this.velvet.triggerSwoop(this.particles);
      this.tryCatchCrashers();
    });
  }

  update(dt) {
    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt);
    if (this.bannerTimer > 0) this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    if (this.windowAlertTimer > 0) this.windowAlertTimer = Math.max(0, this.windowAlertTimer - dt);
    if (this.atticAlertTimer > 0) this.atticAlertTimer = Math.max(0, this.atticAlertTimer - dt);

    if (this.state === 'title') {
      this.guests.forEach(g => g.update(dt, this.level, 0, this.velvet));
      return;
    }

    if (this.state !== 'playing') return;

    // 1. Advance Night Clock (pauses slightly while reading interrogation modal so player isn't rushed unfairly)
    const timeMult = this.ui.isModalOpen() ? 0.35 : 1.0;
    this.nightElapsed += dt * timeMult;

    // Check Hourly Transitions (10:00 PM & 11:00 PM)
    const newHourIdx = this.getHourIndex();
    if (newHourIdx !== this.currentHourIndex) {
      this.currentHourIndex = newHourIdx;
      window.SFX.clockChime();
      this.ui.updateGuestbookContent(newHourIdx);

      if (newHourIdx === 1) {
        this.showBanner(
          '🕙 10:00 PM — SECURITY TIGHTENED!',
          'New Rule: Tickets must start with "VV-" and end in an EVEN digit! Watch the 2nd Floor Window!',
          5.0
        );
      } else if (newHourIdx === 2) {
        this.showBanner(
          '🕚 11:00 PM — FINAL HOUR BEFORE MIDNIGHT!',
          'Impostor Alert: Cross-check Guest Costumes with the VIP Roster! Watch the Attic Chimney!',
          5.2
        );
      }
    }

    // Check Midnight Victory!
    if (this.nightElapsed >= this.nightDuration) {
      this.nightElapsed = this.nightDuration;
      this.state = 'victory';
      this.ui.closeQuestionModal();
      window.SFX.midnightVictory();
      return;
    }

    // 2. Spawn Door Guests & Sneaky Crashers
    this.doorSpawnTimer -= dt * timeMult;
    if (this.doorSpawnTimer <= 0) {
      this.spawnDoorGuest();
      this.doorSpawnTimer = 9.5 - this.currentHourIndex * 1.4;
    }

    this.sneakSpawnTimer -= dt * timeMult;
    if (this.sneakSpawnTimer <= 0) {
      this.spawnSneakyCrasher();
      this.sneakSpawnTimer = 24 - this.currentHourIndex * 5;
    }

    // 3. Update Velvet Player
    if (!this.ui.isModalOpen()) {
      this.velvet.update(dt, this.input, this.level, this.particles);
    } else {
      this.ui.drawPortraits();
    }

    // Auto-catch crashers if Velvet is swoop-dashing or in Bat Form touching them
    if (this.velvet.swoopTimer > 0 || this.velvet.isBat) {
      this.tryCatchCrashers();
    }

    // 4. Update Guests & Gatecrashers
    const queueGuests = this.getQueueGuests();
    for (let i = this.guests.length - 1; i >= 0; i--) {
      const g = this.guests[i];
      const qIdx = g.state === 'queue' ? queueGuests.indexOf(g) : -1;

      g.update(
        dt,
        this.level,
        qIdx,
        this.velvet,
        escapedCrasher => this.handleCrasherEscape(escapedCrasher),
        (cx, cy) => this.spawnCandy(cx, cy)
      );

      // If front door guest ran out of patience
      if (g.state === 'queue' && g.patience <= 0) {
        if (this.ui.activeGuest === g) this.ui.closeQuestionModal();

        if (g.isInvited) {
          // Tired of waiting, leaves annoyed
          this.guests.splice(i, 1);
          this.partyControl = Math.max(0, this.partyControl - 5);
          this.addFloatingText('⏳ Guest tired of waiting! (-5% Control)', 200, 560, '#ff8c3b');
        } else {
          // Uninvited guest barges right through the door!
          g.state = 'fleeing';
          g.x = 310;
          g.vy = -450;
          g.say('Tired of waiting! Crashing the party!', 3.0);
          window.SFX.alarmChase();
          this.addFloatingText('🚪 UNINVITED BARGED IN!', 290, 555, '#ff3b5c');
        }
      }
    }

    // 5. Active Gatecrashers drain Party Control slowly until caught
    const activeCrashers = this.getActiveCrashers();
    window.SFX.chaseMode = activeCrashers.length > 0;
    if (activeCrashers.length > 0) {
      this.partyControl = Math.max(0, this.partyControl - activeCrashers.length * 1.45 * dt);
      if (this.partyControl <= 0) {
        this.partyControl = 0;
        this.state = 'gameover';
        this.ui.closeQuestionModal();
        window.SFX.crasherEscaped();
        return;
      }
    }

    // 6. Update Collectible Soul Candies
    for (let i = this.candies.length - 1; i >= 0; i--) {
      const c = this.candies[i];
      c.life -= dt;
      if (c.y < c.baseY) {
        c.vy += 600 * dt;
        c.y = Math.min(c.baseY, c.y + c.vy * dt);
      }

      const dist = Math.hypot(this.velvet.x - c.x, this.velvet.y - c.y);
      if (dist < 34) {
        this.candies.splice(i, 1);
        this.velvet.batEnergy = Math.min(100, this.velvet.batEnergy + 28);
        this.partyControl = Math.min(100, this.partyControl + 3);
        this.score += 50;
        window.SFX.candyPickup();
        this.addFloatingText('🍬 +28 Bat Magic!', c.x, c.y - 16, '#c47aff');
      } else if (c.life <= 0) {
        this.candies.splice(i, 1);
      }
    }

    // 7. Update Particles & Floating Texts
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      const mag = this.screenShake * 18;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // 1. Draw Multi-Floor Spooky Mansion & Courtyard
    const progress = Math.min(1, this.nightElapsed / this.nightDuration);
    this.level.draw(
      ctx,
      this.animTime,
      progress,
      this.velvet,
      this.windowAlertTimer,
      this.atticAlertTimer
    );

    // 2. Draw Collectible Soul Candies
    for (const c of this.candies) {
      const bob = Math.sin(this.animTime * 8 + c.x) * 3;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.fillStyle = '#ff5ca8';
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(10, 5);
      ctx.lineTo(10, -5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffd15c';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Guests & Gatecrashers
    const queue = this.getQueueGuests();
    for (const g of this.guests) {
      window.GameData.drawGuestSprite(ctx, g.x, g.y, g, this.animTime, 1);

      // Door Queue Front Guest Prompt
      if (g.state === 'queue' && queue[0] === g && this.state === 'playing') {
        const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
        const canQuestion = distToDoor <= 115;

        // Patience bar
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(g.x - 20, g.y - 46, 40, 5);
        ctx.fillStyle = g.patience > 35 ? '#38f2af' : '#ff3b5c';
        ctx.fillRect(g.x - 20, g.y - 46, (40 * Math.max(0, g.patience)) / 100, 5);

        // Prompt pill
        const pulse = Math.sin(this.animTime * 7) * 2;
        ctx.fillStyle = canQuestion ? '#ffd15c' : 'rgba(36, 20, 61, 0.9)';
        ctx.strokeStyle = '#ffd15c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(g.x - 54, g.y - 74 + pulse, 108, 22, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = canQuestion ? '#1a0b2e' : '#ffd15c';
        ctx.font = '700 11px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(canQuestion ? '[E] QUESTION GUEST' : '🚪 GUEST WAITING!', g.x, g.y - 59 + pulse);
      }

      // Fleeing / Sneaking Gatecrasher Marker & Escape Bar
      if (g.state === 'fleeing' || g.state === 'sneaking') {
        const bounce = Math.sin(this.animTime * 12) * 3;
        ctx.fillStyle = '#ff2a55';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(g.x - 56, g.y - 68 + bounce, 112, 20, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '700 10.5px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚨 UNINVITED! [J/CLICK]', g.x, g.y - 54 + bounce);

        // Escape timer bar
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(g.x - 24, g.y - 44, 48, 5);
        ctx.fillStyle = '#ff9d47';
        ctx.fillRect(g.x - 24, g.y - 44, (48 * Math.max(0, g.escapeTimer)) / g.maxEscapeTimer, 5);
      }

      // Speech callout bubble
      if (g.calloutTimer > 0 && g.calloutText) {
        ctx.save();
        ctx.font = '600 11px Fredoka, sans-serif';
        const w = Math.min(220, ctx.measureText(g.calloutText).width + 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.strokeStyle = '#4e2a84';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(g.x - w / 2, g.y - 98, w, 22, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1b0b2e';
        ctx.textAlign = 'center';
        ctx.fillText(g.calloutText, g.x, g.y - 83);
        ctx.restore();
      }
    }

    // 4. Draw Velvet Player
    window.GameData.drawVelvetSprite(ctx, this.velvet, this.animTime);

    // 5. Draw Particles & Floating Score Texts
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = '700 15px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#120721';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // 6. Draw HUD or State Screens
    if (this.state === 'playing') {
      this.drawHUD(ctx);
    } else if (this.state === 'title') {
      this.drawTitleScreen(ctx);
    } else if (this.state === 'victory') {
      this.drawEndScreen(ctx, true);
    } else if (this.state === 'gameover') {
      this.drawEndScreen(ctx, false);
    }

    ctx.restore();
  }

  drawHUD(ctx) {
    // Top HUD Panel
    ctx.save();

    // 1. Party Control Meter (Top Left)
    ctx.fillStyle = 'rgba(20, 10, 38, 0.88)';
    ctx.strokeStyle = '#6c3bb8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(18, 16, 265, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f9f3ff';
    ctx.font = '700 13px Fredoka, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏠 PARTY CONTROL: ${Math.ceil(this.partyControl)}%`, 30, 38);

    // Bar background
    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.roundRect(30, 48, 240, 18, 8);
    ctx.fill();

    const ctrlColor =
      this.partyControl > 60 ? '#38f2af' : this.partyControl > 30 ? '#ffd15c' : '#ff3b5c';
    ctx.fillStyle = ctrlColor;
    ctx.beginPath();
    ctx.roundRect(30, 48, Math.max(0, (240 * this.partyControl) / 100), 18, 8);
    ctx.fill();

    // 2. Bat Magic Stamina Meter (Next to Party Control)
    ctx.fillStyle = 'rgba(20, 10, 38, 0.88)';
    ctx.strokeStyle = this.velvet.isBat ? '#ff5ca8' : '#6c3bb8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(295, 16, 225, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e5b8ff';
    ctx.font = '700 13px Fredoka, sans-serif';
    ctx.fillText(
      this.velvet.isBat ? '🦇 BAT FORM: ACTIVE!' : '🦇 BAT MAGIC [SHIFT]:',
      308,
      38
    );

    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.roundRect(308, 48, 198, 18, 8);
    ctx.fill();

    ctx.fillStyle = '#b85cff';
    ctx.beginPath();
    ctx.roundRect(308, 48, Math.max(0, (198 * this.velvet.batEnergy) / 100), 18, 8);
    ctx.fill();

    // 3. Midnight Clock & Progress (Top Center-Right)
    ctx.fillStyle = 'rgba(20, 10, 38, 0.9)';
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(535, 16, 250, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 18px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏰ ${this.getTimeString()}`, 660, 42);

    ctx.fillStyle = '#c2aee0';
    ctx.font = '600 11.5px Fredoka, sans-serif';
    ctx.fillText('SURVIVE UNTIL 12:00 AM MIDNIGHT', 660, 64);

    // 4. Score, Combo & Active Crasher Alert (Top Right)
    const activeCrashers = this.getActiveCrashers().length;
    ctx.fillStyle = 'rgba(20, 10, 38, 0.88)';
    ctx.strokeStyle = activeCrashers > 0 ? '#ff3b5c' : '#6c3bb8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(800, 16, 260, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 15px Fredoka, sans-serif';
    ctx.fillText(`⭐ SCORE: ${this.score}  (x${this.combo})`, 815, 40);

    ctx.fillStyle = activeCrashers > 0 ? '#ff4d6d' : '#38f2af';
    ctx.font = '700 12.5px Fredoka, sans-serif';
    ctx.fillText(
      activeCrashers > 0
        ? `🚨 ${activeCrashers} CRASHER(S) IN MANOR!`
        : `✅ MANOR SECURE (${this.stats.crashersCaught} Caught)`,
      815,
      64
    );

    // 5. Quick Active Rule Reminder Pill (Top Far Right)
    ctx.fillStyle = 'rgba(20, 10, 38, 0.88)';
    ctx.strokeStyle = '#ff8c3b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(1072, 16, 190, 64, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff9d47';
    ctx.font = '700 11.5px Fredoka, sans-serif';
    ctx.fillText('🔑 PASS: "BLOOD MOON"', 1084, 36);
    ctx.fillStyle = '#f9f3ff';
    ctx.font = '600 10.5px Fredoka, sans-serif';
    ctx.fillText('🚫 No Muddy Boots', 1084, 52);
    ctx.fillText(
      this.currentHourIndex >= 1 ? '🎟️ Ticket: VV- + EVEN #' : '📋 [TAB] Full Guest List',
      1084,
      68
    );

    // 6. Hourly Announcement Banner
    if (this.bannerTimer > 0) {
      ctx.fillStyle = 'rgba(28, 12, 54, 0.94)';
      ctx.strokeStyle = '#ffd15c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(320, 95, 640, 62, 16);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd15c';
      ctx.font = '700 18px Fredoka, sans-serif';
      ctx.fillText(this.bannerText, 640, 122);

      ctx.fillStyle = '#f9f3ff';
      ctx.font = '600 13px Fredoka, sans-serif';
      ctx.fillText(this.bannerSub, 640, 144);
    }

    ctx.restore();
  }

  drawTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(11, 5, 22, 0.76)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Main Title Card
    ctx.fillStyle = 'rgba(28, 14, 51, 0.95)';
    ctx.strokeStyle = '#9e47ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(220, 88, 840, 545, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff9d47';
    ctx.font = '700 16px Fredoka, sans-serif';
    ctx.fillText('🎃 SPOOKY-CUTE 2D PLATFORMER • THEME: "UNINVITED" 🦇', 640, 134);

    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 52px Fredoka, sans-serif';
    ctx.fillText('Come In, Velvet!', 640, 192);

    ctx.fillStyle = '#e0ccf7';
    ctx.font = '500 16px Fredoka, sans-serif';
    ctx.fillText(
      'You are Velvet, the party\'s vampire-witch gatekeeper! Keep the mansion under control until Midnight!',
      640,
      228
    );

    // 4 Core Gameplay Pillars Grid
    const pillars = [
      {
        icon: '🕵️',
        title: '1. Question Guests at the Door',
        desc: 'Press [E] at the front door! Check names, tickets, footwear, and tonight\'s secret password ("BLOOD MOON").'
      },
      {
        icon: '🚪',
        title: '2. Spot Uninvited Sneaks',
        desc: 'Turn away suspicious crashers at the door — and watch out for crashers sneaking in the 2nd-floor Window & Attic!'
      },
      {
        icon: '🦇',
        title: '3. Bat Form & Platformer Chase',
        desc: 'Press [SHIFT] to transform into a flying Vampire Bat and [J] / [Click] to Sonic Swoop & catch fleeing gatecrashers!'
      },
      {
        icon: '⏰',
        title: '4. Survive Until 12:00 AM Midnight',
        desc: 'Rules tighten at 10 PM & 11 PM! Keep Party Control above 0% until the clock strikes Midnight!'
      }
    ];

    pillars.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 260 + col * 390;
      const by = 258 + row * 118;

      ctx.fillStyle = 'rgba(48, 25, 82, 0.85)';
      ctx.strokeStyle = '#6c3bb8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, 370, 102, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd15c';
      ctx.font = '700 16px Fredoka, sans-serif';
      ctx.fillText(`${p.icon}  ${p.title}`, bx + 16, by + 30);

      ctx.fillStyle = '#d8c7f0';
      ctx.font = '500 13px Fredoka, sans-serif';
      this.wrapText(ctx, p.desc, bx + 16, by + 54, 338, 18);
    });

    // Start CTA Button
    const pulse = Math.sin(this.animTime * 6) * 4;
    ctx.fillStyle = '#38f2af';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(450 - pulse, 520, 380 + pulse * 2, 64, 16);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0b291e';
    ctx.font = '700 22px Fredoka, sans-serif';
    ctx.fillText('▶ START NIGHT SHIFT (SPACE / CLICK)', 640, 560);

    ctx.restore();
  }

  drawEndScreen(ctx, isVictory) {
    ctx.save();
    ctx.fillStyle = 'rgba(11, 5, 22, 0.82)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = 'rgba(28, 14, 51, 0.96)';
    ctx.strokeStyle = isVictory ? '#38f2af' : '#ff3b5c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(300, 110, 680, 500, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isVictory ? '#38f2af' : '#ff3b5c';
    ctx.font = '700 42px Fredoka, sans-serif';
    ctx.fillText(
      isVictory ? '🕛 MIDNIGHT! PARTY SAVED! 🎃' : '💥 PARTY OUT OF CONTROL!',
      640,
      178
    );

    ctx.fillStyle = '#f9f3ff';
    ctx.font = '600 17px Fredoka, sans-serif';
    ctx.fillText(
      isVictory
        ? 'Velvet kept every uninvited troublemaker in check until 12:00 AM!'
        : 'Too many uninvited gatecrashers overwhelmed Velvet\'s spooky manor!',
      640,
      215
    );

    // Calculate Gatekeeper Rank
    let rank = 'B';
    if (isVictory && this.partyControl >= 80 && this.score >= 1500) rank = 'S+ (MASTER GATEKEEPER)';
    else if (isVictory && this.partyControl >= 55) rank = 'A (SPOOKY PRO)';
    else if (!isVictory) rank = 'C (OVERRUN)';

    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 24px Fredoka, sans-serif';
    ctx.fillText(`🏆 RANK: ${rank}   •   FINAL SCORE: ${this.score}`, 640, 265);

    // Stats Box
    const statLines = [
      `✅ Invited VIPs Admitted: ${this.stats.invitedAdmitted}`,
      `🦇 Uninvited Gatecrashers Caught: ${this.stats.crashersCaught}`,
      `🚪 Uninvited Slipped Past Door: ${this.stats.slippedThroughDoor}`,
      `💨 Crashers Escaped in Manor: ${this.stats.crashersEscaped}`,
      `❌ False Accusations: ${this.stats.falseAccusations}`,
      `🏠 Final Party Control: ${Math.ceil(this.partyControl)}%`
    ];

    statLines.forEach((line, idx) => {
      ctx.fillStyle = '#d8c7f0';
      ctx.font = '600 16px Fredoka, sans-serif';
      ctx.fillText(line, 640, 315 + idx * 32);
    });

    // Play Again Button
    ctx.fillStyle = '#ff8c3b';
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(470, 520, 340, 58, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1b0b2e';
    ctx.font = '700 20px Fredoka, sans-serif';
    ctx.fillText('🔄 PLAY AGAIN (SPACE / CLICK)', 640, 556);

    ctx.restore();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(ts => this.loop(ts));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new ComeInVelvetGame();
});
