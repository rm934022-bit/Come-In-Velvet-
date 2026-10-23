// ============================================================================
// Come In, Velvet! — Main Game Engine, Loop & GameMaker-Style Pixel HUD
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
    this.showBanner('9:00 PM -- SHIFT START!', 'PASSWORD: "BLOOD MOON"  |  NO MUDDY BOOTS!', 4.2);

    this.spawnDoorGuest();
  }

  showBanner(title, subtitle, duration = 3.5) {
    this.bannerText = title;
    this.bannerSub = subtitle;
    this.bannerTimer = duration;
  }

  addFloatingText(text, x, y, color = '#ffcb47') {
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
    const totalMinutes = Math.floor(progress * 180);
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
    crasher.say(fromAttic ? 'Hehe! Down the chimney!' : 'Sneaking in the window!', 3.2);
    this.guests.push(crasher);

    if (fromAttic) {
      this.atticAlertTimer = 3.5;
      this.addFloatingText('! ATTIC BREACH !', spawnX - 40, spawnY - 30, '#e83b55');
    } else {
      this.windowAlertTimer = 3.5;
      this.addFloatingText('! WINDOW BREACH !', spawnX - 50, spawnY - 30, '#e83b55');
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
      if (guest.isInvited) {
        guest.state = 'party';
        guest.x = 305;
        guest.y = 618;
        guest.say('Thanks, Velvet!', 2.8);

        this.stats.invitedAdmitted++;
        const pts = 150 * this.combo;
        this.score += pts;
        this.combo = Math.min(5, this.combo + 1);
        this.partyControl = Math.min(100, this.partyControl + 6);

        window.SFX.admitSuccess();
        this.addFloatingText(`+VIP ADMITTED! +${pts}`, guest.x, guest.y - 36, '#3cd688');
        this.spawnCandy(guest.x + 35, guest.y - 10);
      } else {
        guest.state = 'fleeing';
        guest.x = 320;
        guest.y = 618;
        guest.vy = -420;
        guest.say('Bahaha! Fooled you, Velvet!', 3.4);

        this.stats.slippedThroughDoor++;
        this.combo = 1;
        this.partyControl = Math.max(0, this.partyControl - 9);
        this.screenShake = 0.28;

        window.SFX.admitMistake();
        this.addFloatingText('! CRASHER LET IN -- CATCH THEM !', guest.x + 40, guest.y - 42, '#e83b55');
      }
    } else {
      if (!guest.isInvited) {
        guest.state = 'fleeing';
        guest.x = 315;
        guest.y = 618;
        guest.vy = -520;
        guest.targetX = 820;
        guest.say('Ack! Spotted! Run for it!', 3.2);

        const pts = 100 * this.combo;
        this.score += pts;
        window.SFX.alarmChase();
        this.addFloatingText(`SPOTTED! +${pts} -- CHASE!`, guest.x + 45, guest.y - 42, '#ffcb47');
      } else {
        const idx = this.guests.indexOf(guest);
        if (idx !== -1) this.guests.splice(idx, 1);

        this.stats.falseAccusations++;
        this.combo = 1;
        this.partyControl = Math.max(0, this.partyControl - 10);
        this.screenShake = 0.25;

        window.SFX.admitMistake();
        this.addFloatingText('X FALSE ALARM! THAT WAS A VIP (-10%)', 270, 555, '#e83b55');
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
    this.addFloatingText(`CRASHER CAUGHT! +${pts}`, g.x, g.y - 28, '#3cd688');
    this.spawnCandy(g.x, g.y);

    for (let p = 0; p < 22; p++) {
      const ang = (Math.PI * 2 * p) / 22;
      const spd = 70 + Math.random() * 150;
      this.particles.push({
        x: g.x,
        y: g.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4 + Math.random() * 5,
        color: p % 2 === 0 ? '#3cd688' : '#ffcb47',
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
    this.addFloatingText('! CRASHER ESCAPED (-14% CONTROL) !', crasher.x, crasher.y - 20, '#e83b55');
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
          this.addFloatingText('LOW BAT MP! GRAB CANDY!', this.velvet.x, this.velvet.y - 30, '#ff8533');
        }
      }

      if (code === 'KeyJ' || code === 'KeyZ') {
        this.velvet.triggerSwoop(this.particles);
        this.tryCatchCrashers();
      }

      if (code === 'KeyE') {
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

      const queue = this.getQueueGuests();
      if (queue.length > 0 && mx < 285 && my > 520) {
        const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
        if (distToDoor <= 140) {
          this.ui.openQuestionModal(queue[0], this.getHourIndex(), this.getTimeString());
          return;
        }
      }

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

    const timeMult = this.ui.isModalOpen() ? 0.35 : 1.0;
    this.nightElapsed += dt * timeMult;

    const newHourIdx = this.getHourIndex();
    if (newHourIdx !== this.currentHourIndex) {
      this.currentHourIndex = newHourIdx;
      window.SFX.clockChime();
      this.ui.updateGuestbookContent(newHourIdx);

      if (newHourIdx === 1) {
        this.showBanner(
          '10:00 PM -- SECURITY LEVEL 2',
          'TICKETS MUST START WITH "VV-" AND END IN AN EVEN NUMBER!',
          5.0
        );
      } else if (newHourIdx === 2) {
        this.showBanner(
          '11:00 PM -- FINAL HOUR RUSH!',
          'IMPOSTOR ALERT: CHECK VIP COSTUMES IN LEDGER [TAB]!',
          5.2
        );
      }
    }

    if (this.nightElapsed >= this.nightDuration) {
      this.nightElapsed = this.nightDuration;
      this.state = 'victory';
      this.ui.closeQuestionModal();
      window.SFX.midnightVictory();
      return;
    }

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

    if (!this.ui.isModalOpen()) {
      this.velvet.update(dt, this.input, this.level, this.particles);
    } else {
      this.ui.drawPortraits();
    }

    if (this.velvet.swoopTimer > 0 || this.velvet.isBat) {
      this.tryCatchCrashers();
    }

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

      if (g.state === 'queue' && g.patience <= 0) {
        if (this.ui.activeGuest === g) this.ui.closeQuestionModal();

        if (g.isInvited) {
          this.guests.splice(i, 1);
          this.partyControl = Math.max(0, this.partyControl - 5);
          this.addFloatingText('GUEST LEFT ANNOYED (-5%)', 200, 560, '#ff8533');
        } else {
          g.state = 'fleeing';
          g.x = 310;
          g.vy = -450;
          g.say('Tired of waiting! Crashing in!', 3.0);
          window.SFX.alarmChase();
          this.addFloatingText('! CRASHER BARGED IN !', 290, 555, '#e83b55');
        }
      }
    }

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
        this.addFloatingText('+28 BAT MP', c.x, c.y - 16, '#c47aff');
      } else if (c.life <= 0) {
        this.candies.splice(i, 1);
      }
    }

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

  // Helper: Draw classic GameMaker hard-edged pixel box with offset shadow
  drawGMBox(ctx, x, y, w, h, bg = '#140b24', border = '#f4e4bc', innerBorder = '#4b2b78') {
    // Hard black pixel shadow
    ctx.fillStyle = '#05020a';
    ctx.fillRect(x + 4, y + 4, w, h);

    // Main fill
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // Inner border
    if (innerBorder) {
      ctx.strokeStyle = innerBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    }

    // Outer crisp border
    ctx.strokeStyle = border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
  }

  // Helper: Segmented arcade bar
  drawSegmentedBar(ctx, x, y, w, h, pct, fillColor, segments = 10) {
    ctx.fillStyle = '#080312';
    ctx.fillRect(x, y, w, h);

    const fillW = Math.max(0, Math.min(w - 4, ((w - 4) * pct) / 100));
    ctx.fillStyle = fillColor;
    ctx.fillRect(x + 2, y + 2, fillW, h - 4);

    // Segment dividers
    ctx.fillStyle = '#080312';
    const segW = w / segments;
    for (let i = 1; i < segments; i++) {
      ctx.fillRect(x + Math.floor(i * segW), y, 2, h);
    }

    ctx.strokeStyle = '#f4e4bc';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    if (this.screenShake > 0) {
      const mag = this.screenShake * 18;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    const progress = Math.min(1, this.nightElapsed / this.nightDuration);
    this.level.draw(
      ctx,
      this.animTime,
      progress,
      this.velvet,
      this.windowAlertTimer,
      this.atticAlertTimer
    );

    // Collectible Soul Candies
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

      ctx.fillStyle = '#ffcb47';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Guests & Gatecrashers
    const queue = this.getQueueGuests();
    for (const g of this.guests) {
      window.GameData.drawGuestSprite(ctx, g.x, g.y, g, this.animTime, 1);

      // Door Queue Front Guest Prompt
      if (g.state === 'queue' && queue[0] === g && this.state === 'playing') {
        const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
        const canQuestion = distToDoor <= 115;

        // Patience bar
        ctx.fillStyle = '#080312';
        ctx.fillRect(g.x - 21, g.y - 47, 42, 7);
        ctx.fillStyle = g.patience > 35 ? '#3cd688' : '#e83b55';
        ctx.fillRect(g.x - 20, g.y - 46, (40 * Math.max(0, g.patience)) / 100, 5);

        const pulse = Math.floor(Math.sin(this.animTime * 7) * 2);
        const tagW = 118;
        this.drawGMBox(
          ctx,
          g.x - tagW / 2,
          g.y - 74 + pulse,
          tagW,
          22,
          canQuestion ? '#ffcb47' : '#140b24',
          '#f4e4bc',
          null
        );

        ctx.fillStyle = canQuestion ? '#12061f' : '#ffcb47';
        ctx.font = '700 9px Silkscreen, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(canQuestion ? '[E] INTERROGATE' : 'VISITOR WAITING', g.x, g.y - 60 + pulse);
      }

      // Fleeing / Sneaking Gatecrasher Marker
      if (g.state === 'fleeing' || g.state === 'sneaking') {
        const bounce = Math.floor(Math.sin(this.animTime * 12) * 3);
        this.drawGMBox(ctx, g.x - 58, g.y - 68 + bounce, 116, 20, '#9e1b34', '#ffcb47', null);

        ctx.fillStyle = '#fff';
        ctx.font = '700 8.5px Silkscreen, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! CRASHER [J/CLICK]', g.x, g.y - 55 + bounce);

        // Escape timer bar
        ctx.fillStyle = '#080312';
        ctx.fillRect(g.x - 25, g.y - 45, 50, 6);
        ctx.fillStyle = '#ff8533';
        ctx.fillRect(g.x - 24, g.y - 44, (48 * Math.max(0, g.escapeTimer)) / g.maxEscapeTimer, 4);
      }

      // Speech callout bubble
      if (g.calloutTimer > 0 && g.calloutText) {
        ctx.save();
        ctx.font = '600 12px "Pixelify Sans", monospace';
        const w = Math.min(230, ctx.measureText(g.calloutText).width + 18);
        this.drawGMBox(ctx, g.x - w / 2, g.y - 98, w, 22, '#0e061a', '#f4e4bc', null);

        ctx.fillStyle = '#f7eed7';
        ctx.textAlign = 'center';
        ctx.fillText(g.calloutText, g.x, g.y - 83);
        ctx.restore();
      }
    }

    // Draw Velvet Player
    window.GameData.drawVelvetSprite(ctx, this.velvet, this.animTime);

    // Draw Particles & Floating Texts
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    }
    ctx.globalAlpha = 1;

    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = '700 11px Silkscreen, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#05020a';
      ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // HUD or State Overlays
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
    ctx.save();

    // 1. Party Control Box (Top Left)
    this.drawGMBox(ctx, 16, 12, 255, 58);
    ctx.fillStyle = '#f7eed7';
    ctx.font = '700 10px Silkscreen, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PARTY CONTROL: ${Math.ceil(this.partyControl)}%`, 28, 31);

    const ctrlColor =
      this.partyControl > 60 ? '#3cd688' : this.partyControl > 30 ? '#ffcb47' : '#e83b55';
    this.drawSegmentedBar(ctx, 28, 39, 230, 18, this.partyControl, ctrlColor, 10);

    // 2. Bat Magic Box
    this.drawGMBox(ctx, 283, 12, 225, 58, '#140b24', this.velvet.isBat ? '#ff5ca8' : '#f4e4bc');
    ctx.fillStyle = '#e5b8ff';
    ctx.font = '700 10px Silkscreen, monospace';
    ctx.fillText(this.velvet.isBat ? 'BAT FORM: ON' : 'BAT MP [SHIFT]:', 295, 31);
    this.drawSegmentedBar(ctx, 295, 39, 200, 18, this.velvet.batEnergy, '#a84cff', 8);

    // 3. Midnight Clock Box (Center)
    this.drawGMBox(ctx, 520, 12, 240, 58, '#140b24', '#ffcb47');
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 15px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.getTimeString(), 640, 36);

    ctx.fillStyle = '#b09bc9';
    ctx.font = '700 8.5px Silkscreen, monospace';
    ctx.fillText('GOAL: SURVIVE TO 12:00 AM', 640, 56);

    // 4. Score & Manor Status Box
    const activeCrashers = this.getActiveCrashers().length;
    this.drawGMBox(
      ctx,
      772,
      12,
      268,
      58,
      activeCrashers > 0 ? '#2b0d17' : '#140b24',
      activeCrashers > 0 ? '#e83b55' : '#f4e4bc'
    );
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 11px Silkscreen, monospace';
    ctx.fillText(`SCORE: ${this.score} (x${this.combo})`, 786, 33);

    ctx.fillStyle = activeCrashers > 0 ? '#ff6e83' : '#3cd688';
    ctx.font = '700 9.5px Silkscreen, monospace';
    ctx.fillText(
      activeCrashers > 0
        ? `! ${activeCrashers} CRASHER(S) LOOSE !`
        : `STATUS: SECURE (${this.stats.crashersCaught} CAUGHT)`,
      786,
      54
    );

    // 5. Shift Orders Box (Far Right)
    this.drawGMBox(ctx, 1052, 12, 212, 58);
    ctx.fillStyle = '#ff8533';
    ctx.font = '700 9px Silkscreen, monospace';
    ctx.fillText('PASS: "BLOOD MOON"', 1064, 29);
    ctx.fillStyle = '#f7eed7';
    ctx.font = '700 8.5px Silkscreen, monospace';
    ctx.fillText('* NO MUDDY BOOTS', 1064, 44);
    ctx.fillText(
      this.currentHourIndex >= 1 ? '* TICKET: VV- + EVEN#' : '* [TAB] GUEST LEDGER',
      1064,
      59
    );

    // 6. Bottom In-Canvas Retro Control Legend Strip
    ctx.fillStyle = 'rgba(10, 4, 18, 0.88)';
    ctx.fillRect(0, 696, 1280, 24);
    ctx.strokeStyle = '#4b2b78';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 696);
    ctx.lineTo(1280, 696);
    ctx.stroke();

    ctx.fillStyle = '#d4c2eb';
    ctx.font = '700 9px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      '[A/D] MOVE   [W/SPACE] JUMP   [S] DROP   [E] INTERROGATE DOOR   [SHIFT] BAT FORM   [J/CLICK] SWOOP CATCH',
      640,
      712
    );

    // 7. Hourly Announcement Banner
    if (this.bannerTimer > 0) {
      this.drawGMBox(ctx, 310, 86, 660, 58, '#1a0c30', '#ffcb47');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcb47';
      ctx.font = '700 13px Silkscreen, monospace';
      ctx.fillText(this.bannerText, 640, 111);

      ctx.fillStyle = '#f7eed7';
      ctx.font = '700 9.5px Silkscreen, monospace';
      ctx.fillText(this.bannerSub, 640, 131);
    }

    ctx.restore();
  }

  drawTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 3, 15, 0.78)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGMBox(ctx, 210, 78, 860, 555, '#140b24', '#f4e4bc', '#6838a8');

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8533';
    ctx.font = '700 11px Silkscreen, monospace';
    ctx.fillText('-- SPOOKY 2D GATEKEEPER PLATFORMER  |  THEME: UNINVITED --', 640, 122);

    // Pixel Drop-Shadow Title
    ctx.fillStyle = '#05020a';
    ctx.font = '700 42px Silkscreen, monospace';
    ctx.fillText('COME IN, VELVET!', 644, 179);
    ctx.fillStyle = '#ffcb47';
    ctx.fillText('COME IN, VELVET!', 640, 175);

    ctx.fillStyle = '#d8c7f0';
    ctx.font = '500 17px "Pixelify Sans", monospace';
    ctx.fillText(
      'Play as Velvet, the party gatekeeper. Keep the manor under control until 12:00 AM Midnight!',
      640,
      212
    );

    const pillars = [
      {
        tag: '[01] INTERROGATE',
        title: 'QUESTION VISITORS STEP-BY-STEP',
        desc: 'Press [E] at the door. Use [SPACE] to check tickets, ask the secret password ("BLOOD MOON"), and inspect boots.'
      },
      {
        tag: '[02] SPOT SNEAKS',
        title: 'GUARD WINDOWS & ATTIC',
        desc: 'Turn away impostors at the gate and watch for crashers climbing the 2nd-floor Window and 3rd-floor Chimney!'
      },
      {
        tag: '[03] BAT MORPH',
        title: 'FLY & SONIC SWOOP',
        desc: 'Press [SHIFT] to morph into a Vampire Bat and [J] or [CLICK] to Sonic Swoop and catch fleeing gatecrashers!'
      },
      {
        tag: '[04] MIDNIGHT',
        title: 'HOLD THE FORT TO 12:00 AM',
        desc: 'Security tightens at 10 PM and 11 PM. Keep Party Control above 0% until the clock strikes Midnight!'
      }
    ];

    pillars.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 250 + col * 396;
      const by = 240 + row * 122;

      this.drawGMBox(ctx, bx, by, 384, 106, '#1c0f30', '#6b43a3', null);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff8533';
      ctx.font = '700 9px Silkscreen, monospace';
      ctx.fillText(p.tag, bx + 14, by + 22);

      ctx.fillStyle = '#ffcb47';
      ctx.font = '700 10.5px Silkscreen, monospace';
      ctx.fillText(p.title, bx + 14, by + 40);

      ctx.fillStyle = '#e4d8f5';
      ctx.font = '500 14px "Pixelify Sans", monospace';
      this.wrapText(ctx, p.desc, bx + 14, by + 62, 356, 17);
    });

    // Blinking Arcade Start Button
    const blink = Math.floor(this.animTime * 3) % 2 === 0;
    this.drawGMBox(
      ctx,
      430,
      520,
      420,
      58,
      blink ? '#208c5a' : '#176e46',
      '#f4e4bc',
      null
    );

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 14px Silkscreen, monospace';
    ctx.fillText('► PRESS [SPACE] OR CLICK TO START', 640, 554);

    ctx.restore();
  }

  drawEndScreen(ctx, isVictory) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 3, 15, 0.84)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGMBox(
      ctx,
      290,
      105,
      700,
      505,
      '#140b24',
      isVictory ? '#3cd688' : '#e83b55',
      '#4b2b78'
    );

    ctx.textAlign = 'center';
    ctx.fillStyle = isVictory ? '#3cd688' : '#e83b55';
    ctx.font = '700 28px Silkscreen, monospace';
    ctx.fillText(
      isVictory ? '12:00 AM -- NIGHT CLEAR!' : 'MANOR OVERRUN -- GAME OVER',
      640,
      168
    );

    ctx.fillStyle = '#f7eed7';
    ctx.font = '500 17px "Pixelify Sans", monospace';
    ctx.fillText(
      isVictory
        ? 'Velvet kept every uninvited troublemaker in check until Midnight!'
        : 'Too many uninvited gatecrashers overwhelmed the mansion party!',
      640,
      204
    );

    let rank = 'B';
    if (isVictory && this.partyControl >= 80 && this.score >= 1500) rank = 'S+ (MASTER GATEKEEPER)';
    else if (isVictory && this.partyControl >= 55) rank = 'A (SENIOR GUARD)';
    else if (!isVictory) rank = 'C (OVERRUN)';

    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 15px Silkscreen, monospace';
    ctx.fillText(`RANK: ${rank}   |   SCORE: ${this.score}`, 640, 248);

    const statLines = [
      `VIP GUESTS ADMITTED ......... ${this.stats.invitedAdmitted}`,
      `GATECRASHERS CAUGHT ......... ${this.stats.crashersCaught}`,
      `CRASHERS SLIPPED AT DOOR .... ${this.stats.slippedThroughDoor}`,
      `CRASHERS ESCAPED IN MANOR ... ${this.stats.crashersEscaped}`,
      `FALSE ACCUSATIONS ........... ${this.stats.falseAccusations}`,
      `FINAL PARTY CONTROL ......... ${Math.ceil(this.partyControl)}%`
    ];

    statLines.forEach((line, idx) => {
      ctx.fillStyle = '#d8c7f0';
      ctx.font = '700 11px Silkscreen, monospace';
      ctx.fillText(line, 640, 298 + idx * 32);
    });

    this.drawGMBox(ctx, 455, 515, 370, 54, '#ff8533', '#f4e4bc', null);
    ctx.fillStyle = '#140824';
    ctx.font = '700 13px Silkscreen, monospace';
    ctx.fillText('► PLAY AGAIN [SPACE / CLICK]', 640, 547);

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
