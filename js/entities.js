// ============================================================================
// Come In, Velvet! — Player (Velvet), Guests, Gatecrasher AI & Particles
// ============================================================================

class VelvetPlayer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 18;
    this.facing = 1;

    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpsLeft = 2;
    this.dropThroughTimer = 0;

    // Bat Form & Sonic Swoop
    this.isBat = false;
    this.batEnergy = 100;
    this.maxBatEnergy = 100;
    this.swoopTimer = 0;
    this.swoopCooldown = 0;
  }

  toggleBatForm(particles) {
    if (!this.isBat && this.batEnergy < 15) {
      return false;
    }
    this.isBat = !this.isBat;
    window.SFX.batTransform(this.isBat);

    // Burst of purple bat smoke particles
    for (let i = 0; i < 16; i++) {
      const ang = (Math.PI * 2 * i) / 16;
      const spd = 60 + Math.random() * 110;
      particles.push({
        x: this.x,
        y: this.y - 4,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4 + Math.random() * 5,
        color: i % 2 === 0 ? '#c47aff' : '#ff5ca8',
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55
      });
    }
    return true;
  }

  triggerSwoop(particles) {
    if (this.swoopCooldown > 0) return;
    this.swoopTimer = 0.24;
    this.swoopCooldown = 0.42;
    this.vx = this.facing * (this.isBat ? 560 : 470);
    if (!this.isBat && !this.onGround) {
      this.vy = Math.min(this.vy, -80);
    }
    window.SFX.sonicSwoop();

    for (let i = 0; i < 10; i++) {
      particles.push({
        x: this.x - this.facing * 10,
        y: this.y + (Math.random() - 0.5) * 20,
        vx: -this.facing * (80 + Math.random() * 120),
        vy: (Math.random() - 0.5) * 60,
        r: 3 + Math.random() * 4,
        color: '#38f2af',
        life: 0.28,
        maxLife: 0.28
      });
    }
  }

  update(dt, input, level, particles) {
    if (this.dropThroughTimer > 0) this.dropThroughTimer -= dt;
    if (this.swoopTimer > 0) this.swoopTimer -= dt;
    if (this.swoopCooldown > 0) this.swoopCooldown -= dt;

    const moveDirX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const moveDirY = (input.down ? 1 : 0) - (input.up ? 1 : 0);

    if (moveDirX !== 0) {
      this.facing = moveDirX;
    }

    if (this.isBat) {
      // ======================================================================
      // BAT FLIGHT PHYSICS (8-Directional Agile Flight)
      // ======================================================================
      this.batEnergy -= 18 * dt;
      if (this.batEnergy <= 0) {
        this.batEnergy = 0;
        this.toggleBatForm(particles);
      }

      const flySpeed = this.swoopTimer > 0 ? 540 : 340;
      const targetVx = moveDirX * flySpeed;
      const targetVy = moveDirY * flySpeed;

      this.vx += (targetVx - this.vx) * Math.min(1, dt * 12);
      this.vy += (targetVy - this.vy) * Math.min(1, dt * 12);

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Keep inside mansion/courtyard bounds
      this.x = Math.max(30, Math.min(level.width - 45, this.x));
      this.y = Math.max(115, Math.min(618, this.y));

      // Bat trail particles
      if (Math.random() < 0.45) {
        particles.push({
          x: this.x + (Math.random() - 0.5) * 12,
          y: this.y + (Math.random() - 0.5) * 12,
          vx: -this.vx * 0.15,
          vy: -20,
          r: 2.5 + Math.random() * 2.5,
          color: this.swoopTimer > 0 ? '#38f2af' : '#b366ff',
          life: 0.25,
          maxLife: 0.25
        });
      }
      return;
    }

    // ========================================================================
    // STANDARD PLATFORMER PHYSICS
    // ========================================================================
    this.batEnergy = Math.min(this.maxBatEnergy, this.batEnergy + 13 * dt);

    const runSpeed = this.swoopTimer > 0 ? 460 : 285;
    if (this.swoopTimer <= 0) {
      const targetVx = moveDirX * runSpeed;
      this.vx += (targetVx - this.vx) * Math.min(1, dt * 15);
    }

    // Drop through one-way platforms with S / Down
    if (input.down && this.onGround) {
      this.dropThroughTimer = 0.22;
      this.onGround = false;
    }

    // Gravity
    const gravity = 1480;
    this.vy += gravity * dt;
    if (this.vy > 820) this.vy = 820;

    const prevBottom = this.y + 22;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const newBottom = this.y + 22;

    // Horizontal boundaries
    this.x = Math.max(32, Math.min(level.width - 48, this.x));
    if (this.y < 115) {
      this.y = 115;
      if (this.vy < 0) this.vy = 0;
    }

    // Check Bounce Pads
    for (const bp of level.bouncePads) {
      if (
        this.vy >= 0 &&
        this.x >= bp.x - 10 &&
        this.x <= bp.x + bp.w + 10 &&
        newBottom >= bp.y &&
        prevBottom <= bp.y + 24
      ) {
        this.y = bp.y - 22;
        this.vy = bp.vyBoost;
        this.onGround = false;
        this.jumpsLeft = 2;
        window.SFX.bouncePad();
        for (let i = 0; i < 8; i++) {
          particles.push({
            x: this.x + (Math.random() - 0.5) * 24,
            y: bp.y,
            vx: (Math.random() - 0.5) * 120,
            vy: -60 - Math.random() * 80,
            r: 3.5,
            color: '#ffd15c',
            life: 0.3,
            maxLife: 0.3
          });
        }
      }
    }

    // Platform Collisions
    this.onGround = false;
    for (const p of level.platforms) {
      const withinX = this.x >= p.x - 10 && this.x <= p.x + p.w + 10;
      if (!withinX) continue;

      if (p.oneWay && this.dropThroughTimer > 0) continue;

      if (this.vy >= 0 && prevBottom <= p.y + 14 && newBottom >= p.y) {
        this.y = p.y - 22;
        if (p.bouncy && this.vy > 220) {
          this.vy = -510;
          this.jumpsLeft = 2;
          window.SFX.bouncePad();
        } else {
          this.vy = 0;
          this.onGround = true;
          this.coyoteTimer = 0.12;
          this.jumpsLeft = 2;
        }
        break;
      }
    }

    if (!this.onGround && this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }
  }

  jump(particles) {
    if (this.isBat) {
      this.triggerSwoop(particles);
      return;
    }

    if (this.onGround || this.coyoteTimer > 0) {
      this.vy = -565;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpsLeft = 1;
      window.SFX.jump();
    } else if (this.jumpsLeft > 0) {
      this.vy = -515;
      this.jumpsLeft--;
      window.SFX.doubleJump();

      // Cute double-jump star ring
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: this.x + (Math.random() - 0.5) * 20,
          y: this.y + 18,
          vx: (Math.random() - 0.5) * 110,
          vy: 30 + Math.random() * 40,
          r: 3,
          color: '#ff9d47',
          life: 0.25,
          maxLife: 0.25
        });
      }
    }
  }
}

class GuestEntity {
  constructor(profile, x, y, initialState = 'queue') {
    Object.assign(this, profile);
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.state = initialState; // 'queue' | 'party' | 'fleeing' | 'sneaking'
    this.bobOffset = Math.random() * Math.PI * 2;

    // Patience while waiting at front door
    this.patience = 100;
    this.maxPatience = 100;

    // AI timers for party / fleeing
    this.aiTimer = 0;
    this.escapeTimer = 20; // Seconds before a fleeing crasher escapes out the attic chimney
    this.maxEscapeTimer = 20;
    this.targetX = 650;
    this.dropTimer = 0;
    this.candyDropTimer = 6 + Math.random() * 6;
    this.calloutText = '';
    this.calloutTimer = 0;
  }

  say(text, duration = 2.6) {
    this.calloutText = text;
    this.calloutTimer = duration;
  }

  update(dt, level, queueIndex, velvet, onCrasherEscape, onSpawnCandy) {
    if (this.calloutTimer > 0) this.calloutTimer -= dt;
    if (this.dropTimer > 0) this.dropTimer -= dt;

    if (this.state === 'queue') {
      // Line up neatly outside the front door
      const targetQueueX = level.queueStart.x - queueIndex * 48;
      const dx = targetQueueX - this.x;
      if (Math.abs(dx) > 3) {
        this.vx = Math.sign(dx) * 110;
        this.x += this.vx * dt;
        this.facing = 1;
      } else {
        this.vx = 0;
        this.x = targetQueueX;
        this.facing = 1;
      }
      this.y = 618;

      // Front guest loses patience slowly; if it hits 0, they barge in!
      if (queueIndex === 0) {
        this.patience -= dt * 2.1;
      }
      return;
    }

    if (this.state === 'party') {
      // Happy invited guest dancing & mingling on Floor 1
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        this.aiTimer = 2.0 + Math.random() * 2.5;
        this.targetX = 310 + Math.random() * 860;
      }

      const dx = this.targetX - this.x;
      if (Math.abs(dx) > 10) {
        this.vx = Math.sign(dx) * 85;
        this.facing = Math.sign(dx);
      } else {
        this.vx = 0;
      }

      this.x += this.vx * dt;
      this.y = 618;

      // Periodically drop Soul Candy for Velvet
      this.candyDropTimer -= dt;
      if (this.candyDropTimer <= 0) {
        this.candyDropTimer = 11 + Math.random() * 9;
        if (onSpawnCandy) onSpawnCandy(this.x, this.y - 10);
      }
      return;
    }

    if (this.state === 'fleeing' || this.state === 'sneaking') {
      // ======================================================================
      // UNINVITED GATECRASHER PLATFORMING & ESCAPE AI
      // ======================================================================
      this.escapeTimer -= dt;
      if (this.escapeTimer <= 0) {
        if (onCrasherEscape) onCrasherEscape(this);
        return;
      }

      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        this.aiTimer = 0.65 + Math.random() * 0.7;

        // Evade Velvet horizontally if she gets close, otherwise head toward upper floors / attic
        const distToVelvet = Math.hypot(velvet.x - this.x, velvet.y - this.y);
        if (distToVelvet < 180) {
          const awayDir = this.x < velvet.x ? -1 : 1;
          this.targetX = Math.max(310, Math.min(1190, this.x + awayDir * 260));
          // Jump to evade!
          if (this.onGround && Math.random() < 0.75) {
            this.vy = -540;
            this.onGround = false;
          }
        } else {
          // Pick a platform target across the mansion
          this.targetX = 330 + Math.random() * 850;
          if (this.onGround && this.y > 280 && Math.random() < 0.65) {
            this.vy = -555;
            this.onGround = false;
          }
        }
      }

      const speed = 205;
      const dx = this.targetX - this.x;
      if (Math.abs(dx) > 12) {
        this.vx = Math.sign(dx) * speed;
        this.facing = Math.sign(dx);
      } else {
        this.targetX = 330 + Math.random() * 850;
      }

      // Gravity & Platform Collisions for Fleeing Crasher
      this.vy += 1400 * dt;
      if (this.vy > 750) this.vy = 750;

      const prevBottom = this.y + 22;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const newBottom = this.y + 22;

      // Stay inside the mansion walls (285..1210)
      if (this.x < 285) {
        this.x = 285;
        this.targetX = 950;
      }
      if (this.x > 1210) {
        this.x = 1210;
        this.targetX = 420;
      }

      // Check Bounce Pads for Crashers too!
      for (const bp of level.bouncePads) {
        if (
          this.vy >= 0 &&
          this.x >= bp.x - 8 &&
          this.x <= bp.x + bp.w + 8 &&
          newBottom >= bp.y &&
          prevBottom <= bp.y + 24
        ) {
          this.y = bp.y - 22;
          this.vy = bp.vyBoost * 0.92;
          this.onGround = false;
        }
      }

      this.onGround = false;
      for (const p of level.platforms) {
        if (this.x < p.x - 8 || this.x > p.x + p.w + 8) continue;
        if (this.vy >= 0 && prevBottom <= p.y + 14 && newBottom >= p.y) {
          this.y = p.y - 22;
          this.vy = p.bouncy && this.vy > 200 ? -480 : 0;
          this.onGround = this.vy === 0;
          break;
        }
      }
    }
  }
}

window.Entities = {
  VelvetPlayer,
  GuestEntity
};
