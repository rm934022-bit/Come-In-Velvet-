// ============================================================================
// Come In, Velvet! — Main Game Engine, GameMaker Title Menu, Codex & HUD
// ============================================================================

class ComeInVelvetGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.level = new window.MansionLevel();
    this.velvet = new window.Entities.VelvetPlayer(360, 618);
    this.ui = new window.UIController(this);

    // States: 'title' | 'playing' | 'paused' | 'victory' | 'gameover'
    this.state = 'title';
    // Subscreens when in title/paused: 'main' | 'howto' | 'codex'
    this.menuSubscreen = 'main';
    this.menuIndex = 0;
    this.pauseIndex = 0;

    // Stage selection: 0 = Grand Ballroom, 1 = Alchemy Conservatory, 2 = Clockwork Belfry
    this.currentLevelIndex = 0;

    // Difficulty settings: 0 = RELAXED, 1 = STANDARD, 2 = NIGHTMARE
    this.difficultyIndex = 1;
    this.difficulties = [
      { name: 'RELAXED', duration: 150, drainMult: 0.7, spawnMult: 1.25, desc: 'Slower clock & gentler party control drain.' },
      { name: 'STANDARD', duration: 165, drainMult: 1.0, spawnMult: 1.0, desc: 'The classic 9:00 PM to 12:00 AM gatekeeper shift.' },
      { name: 'NIGHTMARE', duration: 180, drainMult: 1.4, spawnMult: 0.78, desc: 'Fast gatecrashers, strict patience & chaotic rush!' }
    ];

    this.animTime = 0;
    this.lastTimestamp = performance.now();

    // Night clock & progression
    this.nightDuration = 165;
    this.nightElapsed = 0;
    this.currentHourIndex = 0;

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

    // Decorative title screen bats & embers
    this.menuBats = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * 1280,
      y: 70 + Math.random() * 240,
      vx: 35 + Math.random() * 45,
      phase: i * 1.3
    }));

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
    this.level.loadLevel(this.currentLevelIndex);
    this.guests = [];
    for (let i = 0; i < 5; i++) {
      const profile = window.GameData.generateDoorGuest(0, this.currentLevelIndex);
      profile.costume = window.GameData.COSTUME_TYPES[i % window.GameData.COSTUME_TYPES.length];
      const g = new window.Entities.GuestEntity(profile, 380 + i * 165, 618, 'party');
      this.guests.push(g);
    }
  }

  getDifficulty() {
    return this.difficulties[this.difficultyIndex];
  }

  getLevelMeta() {
    return window.GameData.LEVEL_META[this.currentLevelIndex] || window.GameData.LEVEL_META[0];
  }

  startNewNight() {
    window.SFX.init();
    window.SFX.menuSelect();
    window.SFX.startMusic();

    const diff = this.getDifficulty();
    const lvlMeta = this.getLevelMeta();
    this.nightDuration = diff.duration;
    this.level.loadLevel(this.currentLevelIndex);

    this.state = 'playing';
    this.menuSubscreen = 'main';
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
    this.sneakSpawnTimer = 20.0 * diff.spawnMult;
    this.windowAlertTimer = 0;
    this.atticAlertTimer = 0;

    this.ui.closeQuestionModal();
    this.ui.drawer.classList.add('hidden');
    this.ui.updateGuestbookContent(0);
    this.showBanner(
      lvlMeta.title,
      `PASSWORD: "${lvlMeta.password}"  |  ${lvlMeta.subtitle.toUpperCase()}`,
      4.5
    );

    this.spawnDoorGuest();
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.menuSubscreen = 'main';
      this.pauseIndex = 0;
      window.SFX.menuMove();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.menuSubscreen = 'main';
      window.SFX.menuSelect();
    }
  }

  returnToTitleMenu() {
    this.ui.closeQuestionModal();
    this.ui.drawer.classList.add('hidden');
    this.state = 'title';
    this.menuSubscreen = 'main';
    this.menuIndex = 0;
    this.seedTitleDemo();
    window.SFX.menuSelect();
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
    if (progress < 0.333) return 0;
    if (progress < 0.666) return 1;
    return 2;
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

    const profile = window.GameData.generateDoorGuest(this.getHourIndex(), this.currentLevelIndex);
    const spawnX = 24 - queue.length * 46;
    const guest = new window.Entities.GuestEntity(profile, spawnX, 618, 'queue');
    this.guests.push(guest);
    window.SFX.doorbell();
  }

  spawnSneakyCrasher() {
    const activeCrashers = this.getActiveCrashers();
    if (activeCrashers.length >= 3) return;

    const hourIdx = this.getHourIndex();
    const profile = window.GameData.generateDoorGuest(hourIdx, this.currentLevelIndex);
    profile.isInvited = false;

    const fromAttic = Math.max(hourIdx, this.currentLevelIndex) >= 2 && Math.random() < 0.45;
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

  // ==========================================================================
  // MENU ACTIONS (Title Menu & Pause Menu)
  // ==========================================================================
  getTitleMenuItems() {
    const lvl = this.getLevelMeta();
    const diff = this.getDifficulty();
    const soundState = window.SFX.muted ? 'OFF' : 'ON';
    return [
      { label: 'START NIGHT SHIFT', desc: `Enter ${lvl.name} and guard the party until 12:00 AM!` },
      { label: `STAGE: < ${lvl.shortName} >`, desc: `${lvl.subtitle} — ${lvl.gimmickDesc}` },
      { label: `DIFFICULTY: < ${diff.name} >`, desc: diff.desc },
      { label: 'HOW TO PLAY', desc: 'Read the Gatekeeper Field Manual & Platforming Controls.' },
      { label: 'VIP GUEST CODEX', desc: 'Inspect the 8 invited VIP guests & their registered costumes.' },
      { label: `SOUND & MUSIC: < ${soundState} >`, desc: 'Toggle procedural chiptune music and sound effects.' }
    ];
  }

  getPauseMenuItems() {
    return [
      { label: 'RESUME SHIFT', desc: 'Return to guarding the mansion.' },
      { label: 'NEXT / CHANGE STAGE', desc: 'Cycle to the next Manor Stage and start a fresh shift.' },
      { label: 'GUEST LEDGER & RULES', desc: 'Open Velvet\'s VIP Roster and active security rules.' },
      { label: 'HOW TO PLAY', desc: 'Review controls and gatekeeper mechanics.' },
      { label: 'RESTART SHIFT', desc: 'Start a fresh night back at 9:00 PM.' },
      { label: 'QUIT TO TITLE MENU', desc: 'Leave current shift and return to the Main Menu.' }
    ];
  }

  cycleStage(dir = 1) {
    const count = window.GameData.LEVEL_META.length;
    this.currentLevelIndex = (this.currentLevelIndex + dir + count) % count;
    this.seedTitleDemo();
    window.SFX.menuMove();
  }

  triggerTitleMenuAction(index) {
    if (index === 0) {
      this.startNewNight();
    } else if (index === 1) {
      this.cycleStage(1);
    } else if (index === 2) {
      this.difficultyIndex = (this.difficultyIndex + 1) % this.difficulties.length;
      window.SFX.menuMove();
    } else if (index === 3) {
      this.menuSubscreen = 'howto';
      window.SFX.menuSelect();
    } else if (index === 4) {
      this.menuSubscreen = 'codex';
      window.SFX.menuSelect();
    } else if (index === 5) {
      this.ui.btnMute.click();
      window.SFX.menuMove();
    }
  }

  triggerPauseMenuAction(index) {
    if (index === 0) {
      this.togglePause();
    } else if (index === 1) {
      const count = window.GameData.LEVEL_META.length;
      this.currentLevelIndex = (this.currentLevelIndex + 1) % count;
      this.startNewNight();
    } else if (index === 2) {
      this.state = 'playing';
      this.ui.toggleGuestbook();
      window.SFX.menuSelect();
    } else if (index === 3) {
      this.menuSubscreen = 'howto';
      window.SFX.menuSelect();
    } else if (index === 4) {
      this.startNewNight();
    } else if (index === 5) {
      this.returnToTitleMenu();
    }
  }

  setupInputs() {
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.state === 'playing' || this.state === 'paused') {
          this.togglePause();
        } else if (this.state === 'title' && this.menuSubscreen !== 'main') {
          this.menuSubscreen = 'main';
          window.SFX.menuMove();
        }
      });
    }

    window.addEventListener('keydown', e => {
      const code = e.code;

      // Global Mute
      if (code === 'KeyM') {
        this.ui.btnMute.click();
        return;
      }

      // 1. TITLE SCREEN NAVIGATION
      if (this.state === 'title') {
        if (this.menuSubscreen !== 'main') {
          if (code === 'Escape' || code === 'Space' || code === 'Enter' || code === 'Backspace') {
            e.preventDefault();
            this.menuSubscreen = 'main';
            window.SFX.menuMove();
          }
          return;
        }

        const items = this.getTitleMenuItems();
        if (code === 'KeyW' || code === 'ArrowUp') {
          e.preventDefault();
          this.menuIndex = (this.menuIndex - 1 + items.length) % items.length;
          window.SFX.menuMove();
        } else if (code === 'KeyS' || code === 'ArrowDown') {
          e.preventDefault();
          this.menuIndex = (this.menuIndex + 1) % items.length;
          window.SFX.menuMove();
        } else if (code === 'KeyA' || code === 'ArrowLeft') {
          if (this.menuIndex === 1) {
            this.cycleStage(-1);
          } else if (this.menuIndex === 2) {
            this.difficultyIndex = (this.difficultyIndex - 1 + this.difficulties.length) % this.difficulties.length;
            window.SFX.menuMove();
          } else if (this.menuIndex === 5) {
            this.ui.btnMute.click();
          }
        } else if (code === 'KeyD' || code === 'ArrowRight') {
          if (this.menuIndex === 1) {
            this.cycleStage(1);
          } else if (this.menuIndex === 2) {
            this.difficultyIndex = (this.difficultyIndex + 1) % this.difficulties.length;
            window.SFX.menuMove();
          } else if (this.menuIndex === 5) {
            this.ui.btnMute.click();
          }
        } else if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          this.triggerTitleMenuAction(this.menuIndex);
        }
        return;
      }

      // 2. PAUSE MENU NAVIGATION
      if (this.state === 'paused') {
        if (this.menuSubscreen !== 'main') {
          if (code === 'Escape' || code === 'Space' || code === 'Enter' || code === 'Backspace') {
            e.preventDefault();
            this.menuSubscreen = 'main';
            window.SFX.menuMove();
          }
          return;
        }

        const items = this.getPauseMenuItems();
        if (code === 'Escape' || code === 'KeyP') {
          e.preventDefault();
          this.togglePause();
        } else if (code === 'KeyW' || code === 'ArrowUp') {
          e.preventDefault();
          this.pauseIndex = (this.pauseIndex - 1 + items.length) % items.length;
          window.SFX.menuMove();
        } else if (code === 'KeyS' || code === 'ArrowDown') {
          e.preventDefault();
          this.pauseIndex = (this.pauseIndex + 1) % items.length;
          window.SFX.menuMove();
        } else if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          this.triggerPauseMenuAction(this.pauseIndex);
        }
        return;
      }

      // 3. VICTORY / GAME OVER SCREEN
      if (this.state === 'victory' || this.state === 'gameover') {
        if (code === 'Space' || code === 'Enter') {
          e.preventDefault();
          if (this.state === 'victory' && this.currentLevelIndex < window.GameData.LEVEL_META.length - 1) {
            this.currentLevelIndex++;
          }
          this.startNewNight();
        } else if (code === 'KeyR') {
          e.preventDefault();
          this.startNewNight();
        } else if (code === 'Escape') {
          e.preventDefault();
          this.returnToTitleMenu();
        }
        return;
      }

      // 4. IN-GAME HOTKEYS
      if (code === 'Escape' && !this.ui.isModalOpen()) {
        e.preventDefault();
        if (!this.ui.drawer.classList.contains('hidden')) {
          this.ui.drawer.classList.add('hidden');
        } else {
          this.togglePause();
        }
        return;
      }
      if (code === 'KeyP' && !this.ui.isModalOpen()) {
        e.preventDefault();
        this.togglePause();
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

    // Mouse Hover support for GameMaker Menus
    this.canvas.addEventListener('mousemove', e => {
      if (this.state !== 'title' && this.state !== 'paused') return;
      if (this.menuSubscreen !== 'main') return;

      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      if (this.state === 'title') {
        const items = this.getTitleMenuItems();
        for (let i = 0; i < items.length; i++) {
          const by = 266 + i * 50;
          if (mx >= 430 && mx <= 850 && my >= by && my <= by + 42) {
            if (this.menuIndex !== i) {
              this.menuIndex = i;
              window.SFX.menuMove();
            }
            break;
          }
        }
      } else if (this.state === 'paused') {
        const items = this.getPauseMenuItems();
        for (let i = 0; i < items.length; i++) {
          const by = 224 + i * 48;
          if (mx >= 440 && mx <= 840 && my >= by && my <= by + 40) {
            if (this.pauseIndex !== i) {
              this.pauseIndex = i;
              window.SFX.menuMove();
            }
            break;
          }
        }
      }
    });

    // Mouse Click support
    this.canvas.addEventListener('mousedown', e => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      if (this.state === 'title') {
        if (this.menuSubscreen !== 'main') {
          this.menuSubscreen = 'main';
          window.SFX.menuMove();
          return;
        }
        const items = this.getTitleMenuItems();
        for (let i = 0; i < items.length; i++) {
          const by = 266 + i * 50;
          if (mx >= 430 && mx <= 850 && my >= by && my <= by + 42) {
            this.menuIndex = i;
            this.triggerTitleMenuAction(i);
            return;
          }
        }
        return;
      }

      if (this.state === 'paused') {
        if (this.menuSubscreen !== 'main') {
          this.menuSubscreen = 'main';
          window.SFX.menuMove();
          return;
        }
        const items = this.getPauseMenuItems();
        for (let i = 0; i < items.length; i++) {
          const by = 224 + i * 48;
          if (mx >= 440 && mx <= 840 && my >= by && my <= by + 40) {
            this.pauseIndex = i;
            this.triggerPauseMenuAction(i);
            return;
          }
        }
        return;
      }

      if (this.state === 'victory' || this.state === 'gameover') {
        if (mx >= 360 && mx <= 625 && my >= 515 && my <= 570) {
          if (this.state === 'victory' && this.currentLevelIndex < window.GameData.LEVEL_META.length - 1) {
            this.currentLevelIndex++;
          }
          this.startNewNight();
        } else if (mx >= 655 && mx <= 920 && my >= 515 && my <= 570) {
          this.returnToTitleMenu();
        } else {
          this.startNewNight();
        }
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

    // Update level moving platforms and gimmicks
    this.level.update(dt, this.animTime);

    // Update decorative menu bats
    for (const b of this.menuBats) {
      b.x += b.vx * dt;
      if (b.x > 1320) b.x = -40;
    }

    if (this.state === 'title') {
      this.guests.forEach(g => g.update(dt, this.level, 0, this.velvet));
      return;
    }

    if (this.state !== 'playing') return;

    const diff = this.getDifficulty();
    const timeMult = this.ui.isModalOpen() ? 0.35 : 1.0;
    this.nightElapsed += dt * timeMult;

    const newHourIdx = this.getHourIndex();
    if (newHourIdx !== this.currentHourIndex) {
      this.currentHourIndex = newHourIdx;
      window.SFX.clockChime();
      this.ui.updateGuestbookContent(newHourIdx, this.currentLevelIndex);

      if (newHourIdx === 1) {
        this.showBanner(
          '10:00 PM -- SECURITY LEVEL 2',
          this.getLevelMeta().rule10pm.toUpperCase(),
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
      this.doorSpawnTimer = (9.5 - this.currentHourIndex * 1.4) * diff.spawnMult;
    }

    this.sneakSpawnTimer -= dt * timeMult;
    if (this.sneakSpawnTimer <= 0) {
      this.spawnSneakyCrasher();
      this.sneakSpawnTimer = (24 - this.currentHourIndex * 5) * diff.spawnMult;
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
      this.partyControl = Math.max(
        0,
        this.partyControl - activeCrashers.length * 1.45 * diff.drainMult * dt
      );
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

  // Helper: Draw classic GameMaker hard-edged pixel box with offset shadow & corner rivets
  drawGMBox(ctx, x, y, w, h, bg = '#140b24', border = '#f4e4bc', innerBorder = '#4b2b78', rivets = false) {
    ctx.fillStyle = '#05020a';
    ctx.fillRect(x + 4, y + 4, w, h);

    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    if (innerBorder) {
      ctx.strokeStyle = innerBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
    }

    ctx.strokeStyle = border;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    if (rivets) {
      ctx.fillStyle = border;
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillRect(x + w - 10, y + 6, 4, 4);
      ctx.fillRect(x + 6, y + h - 10, 4, 4);
      ctx.fillRect(x + w - 10, y + h - 10, 4, 4);
    }
  }

  // Helper: Draw a spooky-cute Bat Wing Crest Emblem for the Menu Header
  drawMenuCrest(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const flap = Math.sin(this.animTime * 4) * 4;

    // Left & Right Bat Wings behind crest
    ctx.fillStyle = '#2d124d';
    ctx.strokeStyle = '#ffcb47';
    ctx.lineWidth = 2;

    // Left Wing
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-78, -18 - flap);
    ctx.lineTo(-66, 8);
    ctx.lineTo(-42, 4);
    ctx.lineTo(-28, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Wing
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(78, -18 - flap);
    ctx.lineTo(66, 8);
    ctx.lineTo(42, 4);
    ctx.lineTo(28, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center Pumpkin Emblem
    ctx.fillStyle = '#ff7b1c';
    ctx.strokeStyle = '#05020a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Stem
    ctx.fillStyle = '#3cd688';
    ctx.fillRect(-3, -20, 6, 7);

    // Glowing Eyes & Grin
    ctx.fillStyle = '#ffcb47';
    ctx.beginPath();
    ctx.moveTo(-10, -1);
    ctx.lineTo(-5, -7);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.moveTo(10, -1);
    ctx.lineTo(5, -7);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawSegmentedBar(ctx, x, y, w, h, pct, fillColor, segments = 10) {
    ctx.fillStyle = '#080312';
    ctx.fillRect(x, y, w, h);

    const fillW = Math.max(0, Math.min(w - 4, ((w - 4) * pct) / 100));
    ctx.fillStyle = fillColor;
    ctx.fillRect(x + 2, y + 2, fillW, h - 4);

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

      if (g.state === 'queue' && queue[0] === g && this.state === 'playing') {
        const distToDoor = Math.hypot(this.velvet.x - this.level.frontDoor.x, this.velvet.y - 618);
        const canQuestion = distToDoor <= 115;

        ctx.fillStyle = '#080312';
        ctx.fillRect(g.x - 21, g.y - 47, 42, 7);
        ctx.fillStyle = g.patience > 35 ? '#3cd688' : '#e83b55';
        ctx.fillRect(g.x - 20, g.y - 46, (40 * Math.max(0, g.patience)) / 100, 5);

        const pulse = Math.floor(Math.sin(this.animTime * 7) * 2);
        const tagW = 132;
        this.drawGMBox(
          ctx,
          g.x - tagW / 2,
          g.y - 76 + pulse,
          tagW,
          24,
          canQuestion ? '#ffcb47' : '#140b24',
          '#f4e4bc',
          null
        );

        ctx.fillStyle = canQuestion ? '#12061f' : '#ffcb47';
        ctx.font = '700 12px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(canQuestion ? '[E] INTERROGATE' : 'VISITOR WAITING', g.x, g.y - 60 + pulse);
      }

      if (g.state === 'fleeing' || g.state === 'sneaking') {
        const bounce = Math.floor(Math.sin(this.animTime * 12) * 3);
        this.drawGMBox(ctx, g.x - 66, g.y - 70 + bounce, 132, 22, '#9e1b34', '#ffcb47', null);

        ctx.fillStyle = '#fff';
        ctx.font = '700 11.5px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('! CRASHER [J/CLICK]', g.x, g.y - 55 + bounce);

        ctx.fillStyle = '#080312';
        ctx.fillRect(g.x - 25, g.y - 45, 50, 6);
        ctx.fillStyle = '#ff8533';
        ctx.fillRect(g.x - 24, g.y - 44, (48 * Math.max(0, g.escapeTimer)) / g.maxEscapeTimer, 4);
      }

      if (g.calloutTimer > 0 && g.calloutText) {
        ctx.save();
        ctx.font = '600 13.5px "Chakra Petch", sans-serif';
        const w = Math.min(260, ctx.measureText(g.calloutText).width + 20);
        this.drawGMBox(ctx, g.x - w / 2, g.y - 100, w, 24, '#0e061a', '#f4e4bc', null);

        ctx.fillStyle = '#ffffff';
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
      ctx.font = '700 14px "Chakra Petch", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#05020a';
      ctx.fillText(ft.text, ft.x + 2, ft.y + 2);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // HUD or Menu Screens
    if (this.state === 'playing') {
      this.drawHUD(ctx);
    } else if (this.state === 'paused') {
      this.drawHUD(ctx);
      this.drawPauseScreen(ctx);
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

    // 1. Party Control Box
    this.drawGMBox(ctx, 16, 12, 255, 58);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "Chakra Petch", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PARTY CONTROL: ${Math.ceil(this.partyControl)}%`, 28, 31);

    const ctrlColor =
      this.partyControl > 60 ? '#3cd688' : this.partyControl > 30 ? '#ffcb47' : '#e83b55';
    this.drawSegmentedBar(ctx, 28, 39, 230, 18, this.partyControl, ctrlColor, 10);

    // 2. Bat Magic Box
    this.drawGMBox(ctx, 283, 12, 225, 58, '#140b24', this.velvet.isBat ? '#ff5ca8' : '#f4e4bc');
    ctx.fillStyle = '#f0d4ff';
    ctx.font = '700 13px "Chakra Petch", monospace';
    ctx.fillText(this.velvet.isBat ? 'BAT FORM: ACTIVE' : 'BAT MP [SHIFT]:', 295, 31);
    this.drawSegmentedBar(ctx, 295, 39, 200, 18, this.velvet.batEnergy, '#a84cff', 8);

    // 3. Midnight Clock & Stage Box
    const lvlMeta = this.getLevelMeta();
    this.drawGMBox(ctx, 520, 12, 240, 58, '#140b24', '#ffcb47');
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 16px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.getTimeString(), 640, 35);

    ctx.fillStyle = '#f0d4ff';
    ctx.font = '700 12px "Chakra Petch", monospace';
    ctx.fillText(lvlMeta.shortName, 640, 56);

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
    ctx.font = '700 14px "Chakra Petch", monospace';
    ctx.fillText(`SCORE: ${this.score}  (x${this.combo})`, 786, 33);

    ctx.fillStyle = activeCrashers > 0 ? '#ff8597' : '#5ef2a8';
    ctx.font = '700 12.5px "Chakra Petch", monospace';
    ctx.fillText(
      activeCrashers > 0
        ? `! ${activeCrashers} CRASHER(S) LOOSE !`
        : `STATUS: SECURE (${this.stats.crashersCaught} CAUGHT)`,
      786,
      54
    );

    // 5. Shift Orders Box (Stage-Specific Password & Ticket Rule - Crisp & Easy to Read)
    this.drawGMBox(ctx, 1052, 12, 212, 58);
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 12px "Space Mono", monospace';
    ctx.fillText(`PASS: "${lvlMeta.password}"`, 1062, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11.5px "Chakra Petch", monospace';
    ctx.fillText('• NO MUDDY BOOTS', 1062, 44);
    const shortRule =
      this.currentLevelIndex === 0
        ? '• TICKET: VV- + EVEN#'
        : this.currentLevelIndex === 1
          ? '• TICKET: AL- + ODD#'
          : '• TICKET: CW- + MULT OF 3';
    ctx.fillStyle = '#72f7bc';
    ctx.fillText(
      this.currentHourIndex >= 1 ? shortRule : '• [TAB] GUEST LEDGER',
      1062,
      59
    );

    // 6. Bottom In-Canvas Retro Control Legend Strip
    ctx.fillStyle = 'rgba(10, 4, 18, 0.92)';
    ctx.fillRect(0, 694, 1280, 26);
    ctx.strokeStyle = '#4b2b78';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 694);
    ctx.lineTo(1280, 694);
    ctx.stroke();

    ctx.fillStyle = '#e5d4ff';
    ctx.font = '700 12.5px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      '[A/D] MOVE   [W/SPACE] JUMP   [S] DROP   [E] INTERROGATE   [SHIFT] BAT FORM   [J/CLICK] SWOOP   [TAB] LEDGER   [ESC] PAUSE',
      640,
      712
    );

    if (this.bannerTimer > 0) {
      this.drawGMBox(ctx, 270, 86, 740, 62, '#1a0c30', '#ffcb47');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcb47';
      ctx.font = '700 15px Silkscreen, monospace';
      ctx.fillText(this.bannerText, 640, 112);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 14px "Chakra Petch", monospace';
      ctx.fillText(this.bannerSub, 640, 134);
    }

    ctx.restore();
  }

  // ==========================================================================
  // GAMEMAKER MAIN TITLE MENU & SUB-SCREENS
  // ==========================================================================
  drawTitleScreen(ctx) {
    ctx.save();

    // Atmospheric twilight vignette over live mansion background
    ctx.fillStyle = 'rgba(9, 4, 18, 0.68)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Flying background bats across the sky
    for (const b of this.menuBats) {
      const by = b.y + Math.sin(this.animTime * 5 + b.phase) * 14;
      const wing = Math.sin(this.animTime * 18 + b.phase) * 6;
      ctx.strokeStyle = '#a864ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - 9, by - wing);
      ctx.lineTo(b.x, by);
      ctx.lineTo(b.x + 9, by - wing);
      ctx.stroke();
    }

    if (this.menuSubscreen === 'howto') {
      this.drawHowToPlaySubscreen(ctx);
      ctx.restore();
      return;
    }

    if (this.menuSubscreen === 'codex') {
      this.drawCodexSubscreen(ctx);
      ctx.restore();
      return;
    }

    // 1. TOP GOTHIC-PIXEL LOGO BANNER
    this.drawGMBox(ctx, 260, 48, 760, 186, '#140b24', '#f4e4bc', '#6838a8', true);
    this.drawMenuCrest(ctx, 640, 48);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff964f';
    ctx.font = '700 13px "Chakra Petch", monospace';
    ctx.fillText('* SPOOKY-CUTE 2D GATEKEEPER PLATFORMER *', 640, 94);

    // Layered 3D Pixel Title
    ctx.font = '700 48px Silkscreen, monospace';
    ctx.fillStyle = '#05020a';
    ctx.fillText('COME IN, VELVET!', 645, 152);
    ctx.fillStyle = '#9e245a';
    ctx.fillText('COME IN, VELVET!', 642, 149);
    ctx.fillStyle = '#ffcb47';
    ctx.fillText('COME IN, VELVET!', 640, 146);

    // Theme Ribbon inside header
    ctx.fillStyle = '#251242';
    ctx.fillRect(320, 172, 640, 30);
    ctx.strokeStyle = '#8b4fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(320, 172, 640, 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13.5px "Chakra Petch", monospace';
    ctx.fillText(
      `STAGE PREVIEW: ${this.getLevelMeta().shortName}   //   SECRET PASS: "${this.getLevelMeta().password}"`,
      640,
      192
    );

    // 2. LEFT CHARACTER PEDESTAL: VELVET (cycles between Witch & Bat Form!)
    this.drawGMBox(ctx, 135, 266, 255, 292, '#140b24', '#6b43a3', '#2d164d', true);
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 14px "Chakra Petch", monospace';
    ctx.fillText('GATEKEEPER HEROINE', 262, 298);

    // Spotlight circle under Velvet
    ctx.fillStyle = 'rgba(168, 76, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(262, 428, 58, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    const showBatPreview = Math.floor(this.animTime / 3.5) % 2 === 1;
    ctx.save();
    ctx.translate(262, 408);
    ctx.scale(1.85, 1.85);
    window.GameData.drawVelvetSprite(
      ctx,
      { x: 0, y: 0, vx: 20, facing: 1, isBat: showBatPreview, swoopTimer: 0 },
      this.animTime
    );
    ctx.restore();

    ctx.fillStyle = '#f0d4ff';
    ctx.font = '700 13px "Chakra Petch", monospace';
    ctx.fillText(showBatPreview ? '[ VAMPIRE BAT FORM ]' : '[ VELVET WITCH FORM ]', 262, 496);
    ctx.fillStyle = '#d4c2eb';
    ctx.font = '600 13.5px "Chakra Petch", sans-serif';
    ctx.fillText('Press [SHIFT] in-game to morph!', 262, 522);

    // 3. RIGHT CHARACTER PEDESTAL: CYCLING PARTY GUESTS & CRASHERS
    this.drawGMBox(ctx, 890, 266, 255, 292, '#140b24', '#6b43a3', '#2d164d', true);
    const vipIdx = Math.floor(this.animTime / 2.5) % window.GameData.VIP_ROSTER.length;
    const sampleVip = window.GameData.VIP_ROSTER[vipIdx];
    const isSusSample = Math.floor(this.animTime / 2.5) % 2 === 1;

    ctx.fillStyle = isSusSample ? '#ff8597' : '#5ef2a8';
    ctx.font = '700 14px "Chakra Petch", monospace';
    ctx.fillText(isSusSample ? 'UNINVITED CRASHER' : 'INVITED VIP GUEST', 1017, 298);

    ctx.fillStyle = isSusSample ? 'rgba(232, 59, 85, 0.16)' : 'rgba(60, 214, 136, 0.16)';
    ctx.beginPath();
    ctx.ellipse(1017, 428, 58, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    window.GameData.drawGuestSprite(
      ctx,
      1017,
      408,
      {
        costume: sampleVip.costume,
        facing: -1,
        vx: 20,
        hasMuddyBoots: isSusSample,
        state: isSusSample ? 'fleeing' : 'party',
        bobOffset: 0
      },
      this.animTime,
      1.85
    );

    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 13.5px "Chakra Petch", monospace';
    ctx.fillText(sampleVip.costume.toUpperCase(), 1017, 496);
    ctx.fillStyle = '#d4c2eb';
    ctx.font = '600 13.5px "Chakra Petch", sans-serif';
    ctx.fillText(isSusSample ? 'Has Imp Horns & Muddy Boots!' : `VIP: ${sampleVip.name}`, 1017, 522);

    // 4. CENTER INTERACTIVE GAMEMAKER MENU STACK (6 ITEMS)
    const menuItems = this.getTitleMenuItems();
    menuItems.forEach((item, idx) => {
      const selected = idx === this.menuIndex;
      const bx = 430;
      const by = 266 + idx * 50;
      const bw = 420;
      const bh = 42;

      this.drawGMBox(
        ctx,
        bx,
        by,
        bw,
        bh,
        selected ? '#381a63' : '#160b28',
        selected ? '#ffcb47' : '#5c388c',
         null
      );

      ctx.textAlign = 'center';
      ctx.font = '700 15px "Chakra Petch", monospace';

      if (selected) {
        const curShift = Math.floor(Math.sin(this.animTime * 10) * 4);
        ctx.fillStyle = '#ff8533';
        ctx.fillText('►', bx + 20 + curShift, by + 27);
        ctx.fillText('◄', bx + bw - 20 - curShift, by + 27);
        ctx.fillStyle = '#ffcb47';
      } else {
        ctx.fillStyle = '#e5d4ff';
      }

      ctx.fillText(item.label, 640, by + 27);
    });

    // 5. BOTTOM DESCRIPTION & CONTROLS FOOTER BOX
    this.drawGMBox(ctx, 210, 582, 860, 78, '#10071f', '#f4e4bc', '#452673');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '600 16px "Chakra Petch", sans-serif';
    ctx.fillText(menuItems[this.menuIndex].desc, 640, 613);

    ctx.fillStyle = '#c4b0de';
    ctx.font = '700 12.5px "Chakra Petch", monospace';
    ctx.fillText(
      '[W/S or UP/DOWN] SELECT     [SPACE / ENTER / CLICK] CONFIRM     [A/D] CHANGE STAGE / DIFFICULTY',
      640,
      643
    );
  }

  drawHowToPlaySubscreen(ctx) {
    this.drawGMBox(ctx, 160, 66, 960, 588, '#140b24', '#f4e4bc', '#6838a8', true);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 24px Silkscreen, monospace';
    ctx.fillText('GATEKEEPER FIELD MANUAL', 640, 114);

    ctx.fillStyle = '#ff964f';
    ctx.font = '700 14px "Chakra Petch", monospace';
    ctx.fillText('HOW TO SURVIVE THE NIGHT SHIFT ACROSS ALL 3 MANOR STAGES', 640, 140);

    const cards = [
      {
        tag: 'STEP 01 // FRONT DOOR CHECK',
        title: 'INTERROGATE VISITORS [E]',
        desc: 'Stand by the Front Door and press [E]. Press [SPACE] to ask 3 questions one-by-one: (1) Name & Ticket, (2) Stage Password, and (3) Boots Check. Press [F] to Admit or [X] if Uninvited!'
      },
      {
        tag: 'STEP 02 // 3 UNIQUE STAGES',
        title: 'MASTER STAGE GIMMICKS',
        desc: 'LVL 1 Ballroom: Chandeliers & Bounce Ottomans. LVL 2 Alchemy: Moving Platforms & Warp Mirrors. LVL 3 Belfry: Updraft Wind Streams & Brass Clockwork Gears!'
      },
      {
        tag: 'STEP 03 // VAMPIRE BAT FORM',
        title: 'MORPH & FLY [SHIFT]',
        desc: 'Uninvited crashers will bolt into the manor or sneak through the 2nd-Floor Window & 3rd-Floor Attic! Press [SHIFT] to morph into a Vampire Bat and fly freely across all 3 floors!'
      },
      {
        tag: 'STEP 04 // SONIC SWOOP',
        title: 'CATCH GATECRASHERS [J / CLICK]',
        desc: 'Press [J] or [LEFT CLICK] to Sonic Swoop and banish fleeing gatecrashers before they drain Party Control or escape out the Attic Exit! Grab Soul Candies to refill Bat MP.'
      }
    ];

    cards.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = 200 + col * 450;
      const by = 166 + row * 195;

      this.drawGMBox(ctx, bx, by, 430, 175, '#1c0f30', '#6b43a3', null);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff964f';
      ctx.font = '700 12.5px "Chakra Petch", monospace';
      ctx.fillText(c.tag, bx + 16, by + 28);

      ctx.fillStyle = '#ffcb47';
      ctx.font = '700 16px "Chakra Petch", monospace';
      ctx.fillText(c.title, bx + 16, by + 52);

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 15px "Chakra Petch", sans-serif';
      this.wrapText(ctx, c.desc, bx + 16, by + 80, 398, 22);
    });

    this.drawGMBox(ctx, 450, 578, 380, 48, '#381a63', '#ffcb47', null);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 15px "Chakra Petch", monospace';
    ctx.fillText('◄ BACK TO MENU [ESC / SPACE / CLICK]', 640, 607);
  }

  drawCodexSubscreen(ctx) {
    this.drawGMBox(ctx, 140, 56, 1000, 608, '#140b24', '#f4e4bc', '#6838a8', true);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 22px Silkscreen, monospace';
    ctx.fillText('OFFICIAL VIP GUEST CODEX', 640, 102);

    ctx.fillStyle = '#f0e6ff';
    ctx.font = '600 15.5px "Chakra Petch", sans-serif';
    ctx.fillText(
      'Study these 8 invited VIPs! At 11:00 PM (and in Stages 2-3), impostors steal their names while wearing the wrong costume!',
      640,
      130
    );

    window.GameData.VIP_ROSTER.forEach((vip, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const bx = 176 + col * 236;
      const by = 152 + row * 204;

      this.drawGMBox(ctx, bx, by, 218, 186, '#1c0f30', '#6b43a3', null);

      // Animated Sprite Preview
      window.GameData.drawGuestSprite(
        ctx,
        bx + 109,
        by + 72,
        {
          costume: vip.costume,
          facing: 1,
          vx: 0,
          hasMuddyBoots: false,
          state: 'party',
          bobOffset: idx
        },
        this.animTime,
        1.45
      );

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 15px "Chakra Petch", monospace';
      ctx.fillText(vip.name.toUpperCase(), bx + 109, by + 130);

      ctx.fillStyle = '#5ef2a8';
      ctx.font = '700 13px "Space Mono", monospace';
      ctx.fillText(vip.costume.toUpperCase(), bx + 109, by + 151);

      ctx.fillStyle = '#d4c2eb';
      ctx.font = '600 13.5px "Chakra Petch", sans-serif';
      ctx.fillText(`Treat: ${vip.favTreat}`, bx + 109, by + 172);
    });

    this.drawGMBox(ctx, 450, 586, 380, 48, '#381a63', '#ffcb47', null);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 15px "Chakra Petch", monospace';
    ctx.fillText('◄ BACK TO MENU [ESC / SPACE / CLICK]', 640, 615);
  }

  // ==========================================================================
  // IN-GAME PAUSE MENU OVERLAY
  // ==========================================================================
  drawPauseScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 3, 15, 0.78)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.menuSubscreen === 'howto') {
      this.drawHowToPlaySubscreen(ctx);
      ctx.restore();
      return;
    }

    this.drawGMBox(ctx, 380, 120, 520, 475, '#140b24', '#f4e4bc', '#6838a8', true);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 22px Silkscreen, monospace';
    ctx.fillText('-- SHIFT PAUSED --', 640, 170);

    ctx.fillStyle = '#e5d4ff';
    ctx.font = '700 13px "Chakra Petch", monospace';
    ctx.fillText(
      `${this.getLevelMeta().shortName}   |   ${this.getTimeString()}   |   CONTROL: ${Math.ceil(this.partyControl)}%`,
      640,
      198
    );

    const items = this.getPauseMenuItems();
    items.forEach((item, idx) => {
      const selected = idx === this.pauseIndex;
      const bx = 440;
      const by = 224 + idx * 48;
      const bw = 400;
      const bh = 40;

      this.drawGMBox(
        ctx,
        bx,
        by,
        bw,
        bh,
        selected ? '#381a63' : '#1a0d30',
        selected ? '#ffcb47' : '#5c388c',
        null
      );

      ctx.font = '700 14.5px "Chakra Petch", monospace';
      if (selected) {
        ctx.fillStyle = '#ff8533';
        ctx.fillText('►', bx + 22, by + 26);
        ctx.fillText('◄', bx + bw - 22, by + 26);
        ctx.fillStyle = '#ffcb47';
      } else {
        ctx.fillStyle = '#e5d4ff';
      }
      ctx.fillText(item.label, 640, by + 26);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15.5px "Chakra Petch", sans-serif';
    ctx.fillText(items[this.pauseIndex].desc, 640, 556);

    ctx.restore();
  }

  drawEndScreen(ctx, isVictory) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 3, 15, 0.84)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const hasNextStage = isVictory && this.currentLevelIndex < window.GameData.LEVEL_META.length - 1;

    this.drawGMBox(
      ctx,
      290,
      105,
      700,
      505,
      '#140b24',
      isVictory ? '#3cd688' : '#e83b55',
      '#4b2b78',
      true
    );

    ctx.textAlign = 'center';
    ctx.fillStyle = isVictory ? '#3cd688' : '#e83b55';
    ctx.font = '700 25px Silkscreen, monospace';
    ctx.fillText(
      isVictory
        ? `12:00 AM -- ${this.getLevelMeta().shortName} CLEAR!`
        : 'MANOR OVERRUN -- GAME OVER',
      640,
      168
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 17px "Chakra Petch", sans-serif';
    ctx.fillText(
      isVictory
        ? `Velvet protected ${this.getLevelMeta().name} until Midnight!`
        : 'Too many uninvited gatecrashers overwhelmed the mansion party!',
      640,
      204
    );

    let rank = 'B';
    if (isVictory && this.partyControl >= 80 && this.score >= 1500) rank = 'S+ (MASTER GATEKEEPER)';
    else if (isVictory && this.partyControl >= 55) rank = 'A (SENIOR GUARD)';
    else if (!isVictory) rank = 'C (OVERRUN)';

    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 17px "Chakra Petch", monospace';
    ctx.fillText(`RANK: ${rank}   |   SCORE: ${this.score}`, 640, 248);

    const statLines = [
      `VIP GUESTS ADMITTED ........... ${this.stats.invitedAdmitted}`,
      `GATECRASHERS CAUGHT ........... ${this.stats.crashersCaught}`,
      `CRASHERS SLIPPED AT DOOR ...... ${this.stats.slippedThroughDoor}`,
      `CRASHERS ESCAPED IN MANOR ..... ${this.stats.crashersEscaped}`,
      `FALSE ACCUSATIONS ............. ${this.stats.falseAccusations}`,
      `FINAL PARTY CONTROL ........... ${Math.ceil(this.partyControl)}%`
    ];

    statLines.forEach((line, idx) => {
      ctx.fillStyle = '#f0e6ff';
      ctx.font = '700 14.5px "Space Mono", monospace';
      ctx.fillText(line, 640, 298 + idx * 32);
    });

    // Two Bottom Buttons: Next Stage / Play Again & Title Menu
    this.drawGMBox(ctx, 360, 515, 265, 52, '#208c5a', '#f4e4bc', null);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 15px "Chakra Petch", monospace';
    ctx.fillText(
      hasNextStage ? '► NEXT STAGE [SPACE]' : '► PLAY AGAIN [SPACE]',
      492,
      546
    );

    this.drawGMBox(ctx, 655, 515, 265, 52, '#381a63', '#f4e4bc', null);
    ctx.fillStyle = '#ffcb47';
    ctx.font = '700 15px "Chakra Petch", monospace';
    ctx.fillText('TITLE MENU [ESC]', 787, 546);

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
