// ============================================================================
// Come In, Velvet! — Multi-Floor Spooky Mansion Level & Environment Renderer
// ============================================================================

class MansionLevel {
  constructor() {
    this.width = 1280;
    this.height = 720;

    // Key locations
    this.frontDoor = { x: 248, y: 590 };
    this.queueStart = { x: 185, y: 618 };
    this.windowEntry = { x: 1175, y: 420 };
    this.atticPortal = { x: 1135, y: 230 };

    // Platforms: solidGround cannot be dropped through; oneWay can be jumped up through or dropped down with S/Down
    this.platforms = [
      // Ground Floor (Porch + Ballroom)
      { x: 0, y: 640, w: 1280, h: 80, oneWay: false, type: 'ground' },

      // Step-up platforms between Floor 1 and Floor 2
      { x: 350, y: 545, w: 115, h: 16, oneWay: true, type: 'wood' },
      { x: 1085, y: 545, w: 120, h: 16, oneWay: true, type: 'wood' },

      // 2nd Floor (Banquet & Library Balconies)
      { x: 275, y: 445, w: 355, h: 18, oneWay: true, type: 'balcony' },
      { x: 665, y: 410, w: 130, h: 16, oneWay: true, type: 'chandelier', bouncy: true },
      { x: 830, y: 445, w: 390, h: 18, oneWay: true, type: 'balcony' },

      // Step-up platforms between Floor 2 and Floor 3
      { x: 480, y: 348, w: 110, h: 16, oneWay: true, type: 'wood' },
      { x: 935, y: 348, w: 110, h: 16, oneWay: true, type: 'wood' },

      // 3rd Floor (Attic & Midnight Belfry)
      { x: 295, y: 255, w: 310, h: 18, oneWay: true, type: 'attic' },
      { x: 645, y: 225, w: 200, h: 18, oneWay: true, type: 'belfry', bouncy: true },
      { x: 885, y: 255, w: 320, h: 18, oneWay: true, type: 'attic' }
    ];

    // Bouncy Velvet Ottomans on Floor 1 & 2 for fast vertical platforming
    this.bouncePads = [
      { x: 385, y: 624, w: 56, h: 16, vyBoost: -650, label: 'Bounce Sofa' },
      { x: 1120, y: 624, w: 56, h: 16, vyBoost: -650, label: 'Velvet Trampoline' }
    ];

    // Background stars
    this.stars = Array.from({ length: 42 }, () => ({
      x: Math.random() * 280,
      y: Math.random() * 480,
      r: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2
    }));
  }

  draw(ctx, animTime, gameProgress, velvet, windowAlertTimer = 0, atticAlertTimer = 0) {
    // 1. Night Sky & Courtyard Backdrop (Left side)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0f051d');
    skyGrad.addColorStop(0.6, '#230d42');
    skyGrad.addColorStop(1, '#120824');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Twinkling stars outside
    this.stars.forEach(s => {
      const alpha = 0.4 + 0.6 * Math.sin(animTime * 3 + s.phase);
      ctx.fillStyle = `rgba(255, 240, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Giant Glowing Blood Moon in Courtyard Sky
    const moonX = 115;
    const moonY = 145;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 110);
    moonGlow.addColorStop(0, 'rgba(255, 110, 140, 0.55)');
    moonGlow.addColorStop(0.5, 'rgba(195, 60, 140, 0.2)');
    moonGlow.addColorStop(1, 'rgba(195, 60, 140, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffccd8';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fill();

    // Spooky silhouetted hill & iron fence on porch
    ctx.fillStyle = '#18092c';
    ctx.beginPath();
    ctx.moveTo(0, 640);
    ctx.quadraticCurveTo(130, 560, 260, 640);
    ctx.fill();

    // Wrought-iron fence posts
    ctx.strokeStyle = '#2d164d';
    ctx.lineWidth = 3;
    for (let fx = 18; fx < 235; fx += 24) {
      ctx.beginPath();
      ctx.moveTo(fx, 575);
      ctx.lineTo(fx, 640);
      ctx.stroke();
    }

    // 2. Grand Haunted Mansion Cross-Section Interior (x: 250 to 1245)
    // Outer stone walls & roof
    ctx.fillStyle = '#1d0e33';
    ctx.strokeStyle = '#4e2a84';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(250, 95, 995, 548, [18, 18, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Mansion Pitched Roof Crest
    ctx.fillStyle = '#140826';
    ctx.beginPath();
    ctx.moveTo(230, 100);
    ctx.lineTo(745, 22);
    ctx.lineTo(1260, 100);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6334a8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Subtle striped Victorian wallpaper inside mansion
    ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
    for (let wx = 270; wx < 1230; wx += 36) {
      ctx.fillRect(wx, 105, 16, 530);
    }

    // Floor divider trims
    ctx.strokeStyle = 'rgba(130, 74, 212, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(255, 445);
    ctx.lineTo(1240, 445);
    ctx.moveTo(255, 255);
    ctx.lineTo(1240, 255);
    ctx.stroke();

    // 3. Mansion Decor per Floor
    this.drawFloor3Decor(ctx, animTime, gameProgress, atticAlertTimer);
    this.drawFloor2Decor(ctx, animTime, velvet, windowAlertTimer);
    this.drawFloor1Decor(ctx, animTime);

    // 4. Draw Front Door Archway & Gatekeeper Podium (x: 248)
    this.drawFrontDoor(ctx, animTime);

    // 5. Draw All Platforms & Bounce Pads
    this.drawPlatforms(ctx, animTime);
  }

  drawFloor3Decor(ctx, animTime, gameProgress, atticAlertTimer) {
    // Center Belfry Midnight Clock (x: 745, y: 162)
    const cx = 745;
    const cy = 158;
    ctx.save();
    ctx.translate(cx, cy);

    // Clock outer glow
    const isNearMidnight = gameProgress > 0.85;
    ctx.fillStyle = isNearMidnight
      ? `rgba(255, 77, 148, ${0.25 + 0.15 * Math.sin(animTime * 10)})`
      : 'rgba(255, 209, 92, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();

    // Clock Face
    ctx.fillStyle = '#2b144d';
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hour ticks
    for (let i = 0; i < 12; i++) {
      const ang = (i * Math.PI) / 6;
      ctx.strokeStyle = i === 0 ? '#ff4d94' : '#c9b3eb';
      ctx.lineWidth = i % 3 === 0 ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * 23, Math.sin(ang) * 23);
      ctx.lineTo(Math.cos(ang) * 28, Math.sin(ang) * 28);
      ctx.stroke();
    }

    // Hands: 9:00 PM (progress 0) to 12:00 AM (progress 1)
    const totalHours = 9 + gameProgress * 3;
    const hourAngle = ((totalHours % 12) / 12) * Math.PI * 2 - Math.PI / 2;
    const minAngle = ((totalHours * 60) % 60 / 60) * Math.PI * 2 - Math.PI / 2;

    // Hour hand
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(hourAngle) * 16, Math.sin(hourAngle) * 16);
    ctx.stroke();

    // Minute hand
    ctx.strokeStyle = '#38f2af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(minAngle) * 24, Math.sin(minAngle) * 24);
    ctx.stroke();

    ctx.restore();

    // Left Attic Potion Shelf (x: 380, y: 195)
    ctx.fillStyle = '#381e5e';
    ctx.fillRect(350, 185, 110, 68);
    ctx.strokeStyle = '#6b3fa8';
    ctx.lineWidth = 2;
    ctx.strokeRect(350, 185, 110, 68);
    // Glowing potion bottles
    const bottleColors = ['#38f2af', '#ff4d94', '#ffd15c', '#5ce1ff'];
    bottleColors.forEach((col, idx) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(362 + idx * 24, 198, 12, 16, 4);
      ctx.fill();
    });

    // Right Attic Escape Vent / Chimney Portal (x: 1135, y: 230)
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

    // Swirl inside vent
    ctx.strokeStyle = atticAlertTimer > 0 ? 'rgba(255, 59, 92, 0.7)' : 'rgba(133, 71, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -2, 14, animTime * 4, animTime * 4 + Math.PI * 1.4);
    ctx.stroke();

    ctx.fillStyle = '#c2aee0';
    ctx.font = '700 9px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ATTIC CHIMNEY', 0, -52);
    ctx.restore();
  }

  drawFloor2Decor(ctx, animTime, velvet, windowAlertTimer) {
    // Spooky Portrait #1 (Left Balcony x: 430, y: 365) — Eyes follow Velvet!
    const drawPortrait = (px, py, frameColor) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = '#160b29';
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-26, -34, 52, 64, 6);
      ctx.fill();
      ctx.stroke();

      // Silhouette head in portrait
      ctx.fillStyle = '#331c54';
      ctx.beginPath();
      ctx.arc(0, -8, 12, 0, Math.PI * 2);
      ctx.ellipse(0, 18, 18, 12, 0, Math.PI, 0);
      ctx.fill();

      // Eyes tracking Velvet
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

    // Hanging Chandelier chains in center (x: 730, y: 410)
    ctx.strokeStyle = '#ffd15c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(730, 243);
    ctx.lineTo(730, 410);
    ctx.stroke();

    // Glowing candles on chandelier
    for (let cx = 680; cx <= 780; cx += 25) {
      ctx.fillStyle = '#fff5d6';
      ctx.fillRect(cx - 2, 398, 4, 12);
      ctx.fillStyle = '#ff9e3b';
      ctx.beginPath();
      ctx.arc(cx, 394 + Math.sin(animTime * 12 + cx) * 1.5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right 2nd Floor Sneak Balcony Window (x: 1175, y: 385)
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

    // Window panes
    ctx.strokeStyle = 'rgba(180, 140, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(0, 42);
    ctx.moveTo(-28, 4);
    ctx.lineTo(28, 4);
    ctx.stroke();

    ctx.fillStyle = alertGlow ? '#ff6e89' : '#c2aee0';
    ctx.font = '700 9px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BALCONY WINDOW', 0, -46);
    ctx.restore();
  }

  drawFloor1Decor(ctx, animTime) {
    // Cozy Haunted Fireplace (x: 845, y: 585)
    ctx.save();
    ctx.translate(845, 590);
    ctx.fillStyle = '#2d184a';
    ctx.strokeStyle = '#63389c';
    ctx.lineWidth = 3;
    ctx.fillRect(-48, -45, 96, 95);
    ctx.strokeRect(-48, -45, 96, 95);

    // Mantle
    ctx.fillStyle = '#43246e';
    ctx.fillRect(-56, -52, 112, 10);

    // Fire opening
    ctx.fillStyle = '#120721';
    ctx.beginPath();
    ctx.arc(0, 15, 28, Math.PI, 0);
    ctx.lineTo(28, 50);
    ctx.lineTo(-28, 50);
    ctx.closePath();
    ctx.fill();

    // Flickering flames
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
    // Tablecloth
    ctx.fillStyle = '#4e1f6e';
    ctx.fillRect(-45, 0, 90, 28);
    ctx.fillStyle = '#ff8c3b';
    ctx.fillRect(-48, 0, 96, 6);

    // Glowing Green/Pink Punch Bowl
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

    // Speaker cones left & right
    ctx.fillStyle = '#120621';
    ctx.beginPath();
    ctx.arc(-30, 15, 7 + beat * 0.3, 0, Math.PI * 2);
    ctx.arc(30, 15, 7 + beat * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd15c';
    ctx.font = '700 9px Silkscreen, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DJ BOOTH', 0, 18);
    ctx.restore();
  }

  drawFrontDoor(ctx, animTime) {
    const dx = this.frontDoor.x;
    const dy = 640;

    ctx.save();
    ctx.translate(dx, dy);

    // Grand Arched Doorway sitting on the mansion left wall
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

    // Glowing Lantern above the front door
    const glow = 0.6 + 0.4 * Math.sin(animTime * 5);
    ctx.fillStyle = `rgba(255, 168, 68, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, -124, 12, 0, Math.PI * 2);
    ctx.fill();

    // Pumpkin Welcome Mat
    ctx.fillStyle = '#ff7b1c';
    ctx.fillRect(-52, -4, 42, 6);

    ctx.restore();
  }

  drawPlatforms(ctx, animTime) {
    for (const p of this.platforms) {
      if (p.type === 'ground') {
        // Porch ground (0..250)
        ctx.fillStyle = '#221038';
        ctx.fillRect(0, p.y, 250, p.h);
        ctx.fillStyle = '#472575';
        ctx.fillRect(0, p.y, 250, 6);

        // Mansion Ballroom Velvet Floor (250..1280)
        ctx.fillStyle = '#260f3d';
        ctx.fillRect(250, p.y, 1030, p.h);
        // Plush crimson-violet carpet runner
        ctx.fillStyle = '#9e245a';
        ctx.fillRect(250, p.y, 995, 8);
        ctx.fillStyle = '#ffd15c';
        ctx.fillRect(250, p.y + 8, 995, 2);
      } else if (p.type === 'chandelier' || p.type === 'belfry') {
        // Gold ornate bouncy platform
        ctx.fillStyle = '#5c2c9c';
        ctx.strokeStyle = '#ffd15c';
        ctx.lineWidth = 2.5;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);
      } else {
        // One-way wooden / balcony platform
        ctx.fillStyle = '#3b1e63';
        ctx.strokeStyle = '#8b4fff';
        ctx.lineWidth = 2;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeRect(p.x, p.y, p.w, p.h);

        // Top highlight strip showing it's a jump-through platform
        ctx.fillStyle = '#b98cff';
        ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 3);
      }
    }

    // Draw Bounce Pads
    for (const bp of this.bouncePads) {
      const pulse = Math.sin(animTime * 8) * 1.5;
      ctx.fillStyle = '#d92b7a';
      ctx.strokeStyle = '#ffd15c';
      ctx.lineWidth = 2;
      ctx.fillRect(bp.x, bp.y - pulse, bp.w, bp.h + pulse);
      ctx.strokeRect(bp.x, bp.y - pulse, bp.w, bp.h + pulse);

      // Upward chevron arrows
      ctx.fillStyle = '#ffd15c';
      ctx.font = '700 8px Silkscreen, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲ BOUNCE ▲', bp.x + bp.w / 2, bp.y - 4);
    }
  }
}

window.MansionLevel = MansionLevel;
