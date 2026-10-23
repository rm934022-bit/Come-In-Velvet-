// ============================================================================
// Come In, Velvet! — 3 Hand-Crafted Multi-Floor Levels & Interactive Gimmicks
// ============================================================================

class MansionLevel {
  constructor(levelIndex = 0) {
    this.width = 1280;
    this.height = 720;

    this.frontDoor = { x: 248, y: 590 };
    this.queueStart = { x: 185, y: 618 };
    this.windowEntry = { x: 1175, y: 420 };
    this.atticPortal = { x: 1135, y: 230 };

    this.stars = Array.from({ length: 42 }, () => ({
      x: Math.random() * 280,
      y: Math.random() * 480,
      r: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2
    }));

    this.loadLevel(levelIndex);
  }

  loadLevel(levelIndex = 0) {
    this.levelIndex = levelIndex;
    this.platforms = [];
    this.bouncePads = [];
    this.teleporters = [];
    this.windZones = [];

    if (levelIndex === 0) {
      // ======================================================================
      // LEVEL 1: THE GRAND BALLROOM (Swinging Chandeliers & Bounce Ottomans)
      // ======================================================================
      this.theme = {
        skyTop: '#0f051d',
        skyMid: '#230d42',
        wallBg: '#1d0e33',
        wallBorder: '#4e2a84',
        carpet: '#9e245a',
        platFill: '#3b1e63',
        platBorder: '#8b4fff',
        platTop: '#b98cff'
      };

      this.windowEntry = { x: 1175, y: 420 };
      this.atticPortal = { x: 1135, y: 230 };

      this.platforms = [
        { x: 0, y: 640, w: 1280, h: 80, oneWay: false, type: 'ground' },

        // Step-up platforms Floor 1 -> 2
        { x: 350, y: 545, w: 115, h: 16, oneWay: true, type: 'wood' },
        { x: 1085, y: 545, w: 120, h: 16, oneWay: true, type: 'wood' },

        // Floor 2 Balconies & Swinging Bouncy Chandelier
        { x: 275, y: 445, w: 335, h: 18, oneWay: true, type: 'balcony' },
        {
          x: 660,
          y: 412,
          ox: 660,
          oy: 412,
          w: 135,
          h: 16,
          oneWay: true,
          type: 'chandelier',
          bouncy: true,
          moveRangeX: 42,
          moveSpeed: 2.0
        },
        { x: 845, y: 445, w: 375, h: 18, oneWay: true, type: 'balcony' },

        // Step-up platforms Floor 2 -> 3
        { x: 480, y: 348, w: 110, h: 16, oneWay: true, type: 'wood' },
        { x: 935, y: 348, w: 110, h: 16, oneWay: true, type: 'wood' },

        // Floor 3 Attic & Belfry
        { x: 295, y: 255, w: 310, h: 18, oneWay: true, type: 'attic' },
        { x: 645, y: 225, w: 200, h: 18, oneWay: true, type: 'belfry', bouncy: true },
        { x: 885, y: 255, w: 320, h: 18, oneWay: true, type: 'attic' }
      ];

      this.bouncePads = [
        { x: 385, y: 624, w: 58, h: 16, vyBoost: -655, label: 'BOUNCE' },
        { x: 1120, y: 624, w: 58, h: 16, vyBoost: -655, label: 'BOUNCE' }
      ];
    } else if (levelIndex === 1) {
      // ======================================================================
      // LEVEL 2: HAUNTED ALCHEMY CONSERVATORY (Moving Slabs & Warp Mirrors)
      // ======================================================================
      this.theme = {
        skyTop: '#061717',
        skyMid: '#0f3630',
        wallBg: '#102426',
        wallBorder: '#2fa88a',
        carpet: '#19735c',
        platFill: '#193d3b',
        platBorder: '#3cd688',
        platTop: '#82f7c1'
      };

      this.windowEntry = { x: 1175, y: 430 };
      this.atticPortal = { x: 1140, y: 225 };

      this.platforms = [
        { x: 0, y: 640, w: 1280, h: 80, oneWay: false, type: 'ground' },

        // Floor 2 Left & Right Alchemy Walkways + Gliding Center Hover-Slab
        { x: 275, y: 455, w: 260, h: 18, oneWay: true, type: 'balcony' },
        {
          x: 640,
          y: 455,
          ox: 640,
          oy: 455,
          w: 150,
          h: 16,
          oneWay: true,
          type: 'moving',
          moveRangeX: 95,
          moveSpeed: 2.3
        },
        { x: 935, y: 455, w: 280, h: 18, oneWay: true, type: 'balcony' },

        // Vertical Elevator Hover-Slabs on Left & Right
        {
          x: 545,
          y: 350,
          ox: 545,
          oy: 350,
          w: 95,
          h: 16,
          oneWay: true,
          type: 'moving',
          moveRangeY: 75,
          moveSpeed: 2.1
        },
        {
          x: 830,
          y: 350,
          ox: 830,
          oy: 350,
          w: 95,
          h: 16,
          oneWay: true,
          type: 'moving',
          moveRangeY: -75,
          moveSpeed: 2.1
        },

        // Floor 3 Upper Observatory Decks
        { x: 285, y: 250, w: 250, h: 18, oneWay: true, type: 'attic' },
        { x: 645, y: 230, w: 180, h: 18, oneWay: true, type: 'belfry', bouncy: true },
        { x: 930, y: 250, w: 280, h: 18, oneWay: true, type: 'attic' }
      ];

      // Bubbling Cauldron Steam Vents (extra high bounce!)
      this.bouncePads = [
        { x: 355, y: 624, w: 62, h: 16, vyBoost: -690, label: 'STEAM' },
        { x: 710, y: 624, w: 64, h: 16, vyBoost: -720, label: 'CAULDRON' },
        { x: 1065, y: 624, w: 62, h: 16, vyBoost: -690, label: 'STEAM' }
      ];

      // Haunted Warp Mirrors (Floor 1 East <-> Floor 3 West)
      this.teleporters = [
        {
          id: 'alchemy_warp',
          a: { x: 1185, y: 612, label: 'WARP A', color: '#3cd688' },
          b: { x: 335, y: 224, label: 'WARP B', color: '#3cd688' }
        }
      ];
    } else {
      // ======================================================================
      // LEVEL 3: CLOCKWORK BELFRY & PHANTOM ROOFTOPS (Wind Streams & Cogs)
      // ======================================================================
      this.theme = {
        skyTop: '#1c0510',
        skyMid: '#3d0c24',
        wallBg: '#240d1d',
        wallBorder: '#d98a3b',
        carpet: '#b8324f',
        platFill: '#3d1c2e',
        platBorder: '#ffcb47',
        platTop: '#ffe494'
      };

      this.windowEntry = { x: 1175, y: 415 };
      this.atticPortal = { x: 1140, y: 220 };

      this.platforms = [
        { x: 0, y: 640, w: 1280, h: 80, oneWay: false, type: 'ground' },

        // Tier 1 Brass Catwalks
        { x: 280, y: 495, w: 210, h: 16, oneWay: true, type: 'balcony' },
        {
          x: 660,
          y: 470,
          ox: 660,
          oy: 470,
          w: 150,
          h: 16,
          oneWay: true,
          type: 'moving',
          moveRangeX: 110,
          moveSpeed: 2.6
        },
        { x: 990, y: 495, w: 220, h: 16, oneWay: true, type: 'balcony' },

        // Tier 2 Oscillating Clockwork Cog Platforms
        {
          x: 495,
          y: 365,
          ox: 495,
          oy: 365,
          w: 130,
          h: 16,
          oneWay: true,
          type: 'chandelier',
          bouncy: true,
          moveRangeX: 55,
          moveRangeY: 35,
          moveSpeed: 2.2
        },
        {
          x: 845,
          y: 365,
          ox: 845,
          oy: 365,
          w: 130,
          h: 16,
          oneWay: true,
          type: 'chandelier',
          bouncy: true,
          moveRangeX: -55,
          moveRangeY: -35,
          moveSpeed: 2.2
        },

        // Tier 3 High Belfry Rooftop Ledges
        { x: 285, y: 240, w: 240, h: 18, oneWay: true, type: 'attic' },
        { x: 635, y: 215, w: 210, h: 18, oneWay: true, type: 'belfry', bouncy: true },
        { x: 940, y: 240, w: 270, h: 18, oneWay: true, type: 'attic' }
      ];

      this.bouncePads = [
        { x: 710, y: 624, w: 68, h: 16, vyBoost: -740, label: 'COG SPRING' }
      ];

      // Updraft Wind Columns (lift Velvet smoothly up all 3 tiers!)
      this.windZones = [
        { x: 355, y: 230, w: 72, h: 410, label: 'UPDRAFT' },
        { x: 1030, y: 230, w: 72, h: 410, label: 'UPDRAFT' }
      ];

      // Diagonal Warp Mirrors
      this.teleporters = [
        {
          id: 'belfry_warp',
          a: { x: 315, y: 612, label: 'ROOF WARP', color: '#ffcb47' },
          b: { x: 1175, y: 214, label: 'FOYER WARP', color: '#ffcb47' }
        }
      ];
    }

    // Initialize platform delta tracking
    for (const p of this.platforms) {
      p.dx = 0;
      p.dy = 0;
    }
  }

  update(dt, animTime) {
    for (const p of this.platforms) {
      const prevX = p.x;
      const prevY = p.y;

      if (p.moveRangeX) {
        p.x = p.ox + Math.sin(animTime * (p.moveSpeed || 2)) * p.moveRangeX;
      }
      if (p.moveRangeY) {
        p.y = p.oy + Math.cos(animTime * (p.moveSpeed || 2)) * p.moveRangeY;
      }

      p.dx = p.x - prevX;
      p.dy = p.y - prevY;
    }
  }

  draw(ctx, animTime, gameProgress, velvet, windowAlertTimer = 0, atticAlertTimer = 0) {
    const t = this.theme;

    // 1. Night Sky & Courtyard Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, t.skyTop);
    skyGrad.addColorStop(0.6, t.skyMid);
    skyGrad.addColorStop(1, '#090412');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    this.stars.forEach(s => {
      const alpha = 0.4 + 0.6 * Math.sin(animTime * 3 + s.phase);
      ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
      ctx.fillRect(s.x, s.y, s.r * 1.5, s.r * 1.5);
    });

    // Moon in Courtyard Sky (Changes tint per stage!)
    const moonX = 115;
    const moonY = 145;
    const moonColors = ['#ffccd8', '#b8ffe3', '#ffd8a8'];
    ctx.fillStyle = moonColors[this.levelIndex] || '#ffccd8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 44, 0, Math.PI * 2);
    ctx.fill();

    // Courtyard hill & iron fence
    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.quadraticCurveTo(130, 560, 260, 640);
    ctx.fill();

    ctx.strokeStyle = '#2d164d';
    ctx.lineWidth = 3;
    for (let fx = 18; fx < 235; fx += 24) {
      ctx.beginPath();
      ctx.moveTo(fx, 575);
      ctx.lineTo(fx, 640);
      ctx.stroke();
    }

    // 2. Grand Mansion Cross-Section Interior (x: 250 to 1245)
    ctx.fillStyle = t.wallBg;
    ctx.strokeStyle = t.wallBorder;
    ctx.lineWidth = 6;
    ctx.fillRect(250, 95, 995, 548);
    ctx.strokeRect(250, 95, 995, 548);

    // Pitched Roof Crest
    ctx.fillStyle = '#10061e';
    ctx.beginPath();
    ctx.moveTo(230, 95);
    ctx.lineTo(745, 20);
    ctx.lineTo(1260, 95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = t.wallBorder;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle striped wallpaper inside
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let wx = 270; wx < 1230; wx += 36) {
      ctx.fillRect(wx, 100, 16, 535);
    }

    // Stage-Specific Background Architecture
    if (this.levelIndex === 1) {
      this.drawAlchemyBackdrop(ctx, animTime);
    } else if (this.levelIndex === 2) {
      this.drawClockworkBackdrop(ctx, animTime);
    }

    // 3. Mansion Decor per Floor
    this.drawFloor3Decor(ctx, animTime, gameProgress, atticAlertTimer);
    this.drawFloor2Decor(ctx, animTime, velvet, windowAlertTimer);
    this.drawFloor1Decor(ctx, animTime);

    // 4. Draw Updraft Wind Streams (Level 3)
    this.drawWindZones(ctx, animTime);

    // 5. Draw Haunted Warp Mirrors (Levels 2 & 3)
    this.drawTeleporters(ctx, animTime);

    // 6. Draw Front Door Archway
    this.drawFrontDoor(ctx, animTime);

    // 7. Draw All Platforms & Bounce Pads
    this.drawPlatforms(ctx, animTime);
  }

  drawAlchemyBackdrop(ctx, animTime) {
    // Glowing Greenhouse Arches & Giant Alchemical Vats
    ctx.strokeStyle = 'rgba(60, 214, 136, 0.16)';
    ctx.lineWidth = 3;
    for (let gx = 360; gx <= 1080; gx += 240) {
      ctx.beginPath();
      ctx.arc(gx, 320, 75, Math.PI, 0);
      ctx.lineTo(gx + 75, 635);
      ctx.moveTo(gx - 75, 320);
      ctx.lineTo(gx - 75, 635);
      ctx.stroke();
    }

    // Rising green alchemy bubbles in background
    ctx.fillStyle = 'rgba(60, 214, 136, 0.25)';
    for (let i = 0; i < 10; i++) {
      const bx = 330 + i * 92;
      const by = 600 - ((animTime * 45 + i * 55) % 450);
      ctx.fillRect(bx, by, 6, 6);
    }
  }

  drawClockworkBackdrop(ctx, animTime) {
    // Giant Rotating Clockwork Gears in the Tower Background
    const drawGear = (gx, gy, r, teeth, speed, col) => {
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(animTime * speed);
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < teeth; i++) {
        const a = (i * Math.PI * 2) / teeth;
        ctx.fillStyle = col;
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(-5, -r - 10, 10, 12);
        ctx.restore();
      }
      ctx.restore();
    };

    drawGear(520, 360, 78, 12, 0.4, 'rgba(255, 203, 71, 0.14)');
    drawGear(665, 290, 56, 8, -0.55, 'rgba(255, 133, 51, 0.15)');
    drawGear(920, 380, 86, 12, 0.35, 'rgba(255, 203, 71, 0.14)');
  }

  drawWindZones(ctx, animTime) {
    for (const wz of this.windZones) {
      ctx.fillStyle = 'rgba(92, 225, 255, 0.08)';
      ctx.fillRect(wz.x, wz.y, wz.w, wz.h);

      ctx.strokeStyle = 'rgba(92, 225, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(wz.x, wz.y, wz.w, wz.h);

      // Animated rising wind streaks
      ctx.fillStyle = 'rgba(180, 245, 255, 0.65)';
      for (let i = 0; i < 6; i++) {
        const sx = wz.x + 12 + ((i * 19) % (wz.w - 20));
        const sy = wz.y + wz.h - ((animTime * 220 + i * 68) % wz.h);
        ctx.fillRect(sx, sy, 3, 22);
      }

      ctx.fillStyle = '#5ce1ff';
      ctx.font = '700 11.5px "Chakra Petch", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲ WIND ▲', wz.x + wz.w / 2, wz.y + wz.h - 8);
    }
  }

  drawTeleporters(ctx, animTime) {
    const drawMirror = (node, partnerLabel) => {
      ctx.save();
      ctx.translate(node.x, node.y);
      const pulse = Math.sin(animTime * 8) * 2;

      ctx.fillStyle = '#0d051a';
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 3;
      ctx.fillRect(-18, -32, 36, 54);
      ctx.strokeRect(-18, -32, 36, 54);

      // Swirling portal core
      ctx.fillStyle = 'rgba(60, 214, 136, 0.28)';
      ctx.fillRect(-12, -26 + pulse, 24, 42 - pulse * 2);

      ctx.fillStyle = node.color;
      ctx.font = '700 11.5px "Chakra Petch", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, 0, -38);
      ctx.restore();
    };

    for (const pair of this.teleporters) {
      drawMirror(pair.a, pair.b.label);
      drawMirror(pair.b, pair.a.label);
    }
  }

  drawFloor3Decor(ctx, animTime, gameProgress, atticAlertTimer) {
    // Center Belfry Midnight Clock (x: 745, y: 158)
    const cx = 745;
    const cy = 158;
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#2b144d';
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      ctx.strokeStyle = i === 0 ? '#ff4d94' : '#c9b3eb';
      ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 23, Math.sin(ang) * 23);
      ctx.lineTo(Math.cos(ang) * 28, Math.sin(ang) * 28);
      ctx.stroke();
    }

    const totalHours = 9 + gameProgress * 3;
    const hourAngle = ((totalHours % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAngle = (((totalHours * 60) % 60) / 60) * Math.PI * 2 - Math.PI / 2;

    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(hourAngle) * 16, Math.sin(hourAngle) * 16);
    ctx.stroke();

    ctx.strokeStyle = '#38f2af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24);
    ctx.stroke();
    ctx.restore();

    // Right Attic Escape Vent / Chimney Portal
    const ax = this.atticPortal.x;
    const ay = this.atticPortal.y;
    ctx.save();
    ctx.translate(ax, ay);
    const pulse = atticAlertTimer > 0 ? Math.sin(animTime * 20) * 5 : 0;

    ctx.fillStyle = '#120721';
    ctx.strokeStyle = atticAlertTimer > 0 ? '#ff3b5c' : '#8547ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -18, 28 + pulse, Math.PI, 0);
    ctx.lineTo(28 + pulse, 24);
    ctx.lineTo(-28 - pulse, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2d4f7';
    ctx.font = '700 11.5px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ATTIC CHIMNEY', 0, -52);
    ctx.restore();
  }

  drawFloor2Decor(ctx, animTime, velvet, windowAlertTimer) {
    const drawPortrait = (px, py, frameColor) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = '#160b29';
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.fillRect(-26, -34, 52, 64);
      ctx.strokeRect(-26, -34, 52, 64);

      ctx.fillStyle = '#331c54';
      ctx.beginPath();
      ctx.arc(0, -8, 12, 0, Math.PI * 2);
      ctx.ellipse(0, 18, 18, 12, 0, Math.PI, 0);
      ctx.fill();

      const dx = velvet ? Math.max(-3, Math.min(3, (velvet.x - px) * 0.01)) : 0;
      const dy = velvet ? Math.max(-2, Math.min(2, (velvet.y - py) * 0.01)) : 0;
      ctx.fillStyle = '#ff4d94';
      ctx.beginPath();
      ctx.arc(-4 + dx, -9 + dy, 2.2, 0, Math.PI * 2);
      ctx.arc(4 + dx, -9 + dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawPortrait(395, 365, '#c48f3f');
    drawPortrait(960, 365, '#8f47ff');

    // Right 2nd Floor Sneak Balcony Window
    const wx = this.windowEntry.x;
    const wy = 385;
    ctx.save();
    ctx.translate(wx, wy);
    const alertGlow = windowAlertTimer > 0;
    ctx.fillStyle = '#120829';
    ctx.strokeStyle = alertGlow ? '#ff3b5c' : '#6c3bb8';
    ctx.lineWidth = alertGlow ? 4 : 3;
    ctx.beginPath();
    ctx.arc(0, -12, 28, Math.PI, 0);
    ctx.lineTo(28, 42);
    ctx.lineTo(-28, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(180, 140, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 42);
    ctx.moveTo(-28, 4);
    ctx.lineTo(28, 4);
    ctx.stroke();

    ctx.fillStyle = alertGlow ? '#ff6e89' : '#e2d4f7';
    ctx.font = '700 11.5px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BALCONY WINDOW', 0, -46);
    ctx.restore();
  }

  drawFloor1Decor(ctx, animTime) {
    // Cozy Haunted Fireplace (x: 845, y: 590)
    ctx.save();
    ctx.translate(845, 590);
    ctx.fillStyle = '#2d184a';
    ctx.strokeStyle = '#63389c';
    ctx.lineWidth = 3;
    ctx.fillRect(-48, -45, 96, 95);
    ctx.strokeRect(-48, -45, 96, 95);

    ctx.fillStyle = '#43246e';
    ctx.fillRect(-56, -52, 112, 10);

    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.arc(0, 15, 28, Math.PI, 0);
    ctx.lineTo(28, 50);
    ctx.lineTo(-28, 50);
    ctx.closePath();
    ctx.fill();

    const f1 = Math.sin(animTime * 14) * 5;
    ctx.fillStyle = '#ff6b2b';
    ctx.beginPath();
    ctx.arc(0, 32, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd15c';
    ctx.beginPath();
    ctx.moveTo(-12, 42);
    ctx.quadraticCurveTo(0, 8 + f1, 12, 42);
    ctx.fill();
    ctx.restore();

    // Spooky Punch Table (x: 585, y: 612)
    ctx.save();
    ctx.translate(585, 612);
    ctx.fillStyle = '#4e1f6e';
    ctx.fillRect(-45, 0, 90, 28);
    ctx.fillStyle = '#ff8c3b';
    ctx.fillRect(-48, 0, 96, 6);

    ctx.fillStyle = '#38f2af';
    ctx.beginPath();
    ctx.arc(0, -6, 15, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#d4fff0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // DJ Bones Booth (x: 1015, y: 605)
    ctx.save();
    ctx.translate(1015, 605);
    const beat = Math.abs(Math.sin(animTime * 8)) * 3;
    ctx.fillStyle = '#291347';
    ctx.strokeStyle = '#ff4d94';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-44, -5 - beat * 0.5, 88, 40);
    ctx.strokeRect(-44, -5 - beat * 0.5, 88, 40);

    ctx.fillStyle = '#120621';
    ctx.beginPath();
    ctx.arc(-30, 15, 7 + beat * 0.3, 0, Math.PI * 2);
    ctx.arc(30, 15, 7 + beat * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 11.5px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DJ BOOTH', 0, 19);
    ctx.restore();
  }

  drawFrontDoor(ctx, animTime) {
    const dx = this.frontDoor.x;
    const dy = 640;

    ctx.save();
    ctx.translate(dx, dy);

    ctx.fillStyle = '#3b1c63';
    ctx.strokeStyle = '#ff9d47';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -78, 34, Math.PI, 0);
    ctx.lineTo(34, 0);
    ctx.lineTo(-34, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const glow = 0.6 + 0.4 * Math.sin(animTime * 5);
    ctx.fillStyle = `rgba(255, 168, 68, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, -124, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff7b1c';
    ctx.fillRect(-52, -4, 42, 6);

    ctx.restore();
  }

  drawPlatforms(ctx, animTime) {
    const t = this.theme;

    for (const p of this.platforms) {
      if (p.type === 'ground') {
        ctx.fillStyle = '#221038';
        ctx.fillRect(0, p.y, 250, p.h);
        ctx.fillStyle = '#472575';
        ctx.fillRect(0, p.y, 250, 6);

        ctx.fillStyle = '#1b0c2e';
        ctx.fillRect(250, p.y, 1030, p.h);
        ctx.fillStyle = t.carpet;
        ctx.fillRect(250, p.y, 995, 8);
        ctx.fillStyle = '#ffd15c';
        ctx.fillRect(250, p.y + 8, 995, 2);
      } else if (p.type === 'chandelier' || p.type === 'belfry') {
        ctx.fillStyle = '#5c2c9c';
        ctx.strokeStyle = '#ffd15c';
        ctx.lineWidth = 2.5;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      } else if (p.type === 'moving') {
        // Glowing Alchemical / Clockwork Moving Platform
        ctx.fillStyle = '#193d3b';
        ctx.strokeStyle = '#3cd688';
        ctx.lineWidth = 2.5;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = '#ffcb47';
        ctx.fillRect(p.x + 6, p.y + 5, 6, 6);
        ctx.fillRect(p.x + p.w - 12, p.y + 5, 6, 6);
      } else {
        ctx.fillStyle = t.platFill;
        ctx.strokeStyle = t.platBorder;
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        ctx.fillStyle = t.platTop;
        ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 3);
      }
    }

    for (const bp of this.bouncePads) {
      const pulse = Math.sin(animTime * 8) * 1.5;
      ctx.fillStyle = '#d92b7a';
      ctx.strokeStyle = '#ffd15c';
      ctx.lineWidth = 2;
      ctx.fillRect(bp.x, bp.y - pulse, bp.w, bp.h + pulse);
      ctx.strokeRect(bp.x, bp.y - pulse, bp.w, bp.h + pulse);

      ctx.fillStyle = '#ffd15c';
      ctx.font = '700 11px "Chakra Petch", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`▲ ${bp.label} ▲`, bp.x + bp.w / 2, bp.y - 4);
    }
  }
}

window.MansionLevel = MansionLevel;
