// ============================================================================
// Come In, Velvet! — Procedural Spooky-Cute Web Audio Engine
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.step = 0;
    this.chaseMode = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'triangle', duration = 0.12, vol = 0.14, slideTo = null, delay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  jump() {
    this.playTone(280, 'sine', 0.13, 0.15, 540);
  }

  doubleJump() {
    this.playTone(420, 'triangle', 0.14, 0.16, 780);
    this.playTone(620, 'sine', 0.1, 0.12, 920, 0.04);
  }

  bouncePad() {
    this.playTone(220, 'triangle', 0.22, 0.18, 860);
  }

  batTransform(toBat = true) {
    if (toBat) {
      this.playTone(350, 'sawtooth', 0.12, 0.1, 740);
      this.playTone(580, 'triangle', 0.16, 0.12, 980, 0.05);
    } else {
      this.playTone(720, 'triangle', 0.12, 0.1, 320);
    }
  }

  sonicSwoop() {
    this.playTone(680, 'sawtooth', 0.15, 0.12, 220);
    this.playTone(880, 'sine', 0.11, 0.12, 440, 0.02);
  }

  doorbell() {
    // Spooky-cute ding-dong
    this.playTone(659.25, 'triangle', 0.22, 0.16); // E5
    this.playTone(523.25, 'triangle', 0.35, 0.16, null, 0.18); // C5
  }

  talkBlip(pitchOffset = 1) {
    const base = 360 * pitchOffset + Math.random() * 90;
    this.playTone(base, 'square', 0.055, 0.06, base * 1.12);
  }

  admitSuccess() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.16, 0.14, null, i * 0.07);
    });
  }

  admitMistake() {
    this.playTone(311.13, 'sawtooth', 0.2, 0.15, 240);
    this.playTone(233.08, 'sawtooth', 0.35, 0.16, 160, 0.16);
  }

  alarmChase() {
    this.playTone(587.33, 'sawtooth', 0.14, 0.14, 740);
    this.playTone(587.33, 'sawtooth', 0.16, 0.14, 780, 0.15);
  }

  catchCrasher() {
    const notes = [440, 554.37, 659.25, 880, 1174.66];
    notes.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.14, 0.16, n * 1.05, i * 0.05);
    });
  }

  crasherEscaped() {
    this.playTone(300, 'sawtooth', 0.25, 0.15, 130);
    this.playTone(220, 'sawtooth', 0.35, 0.15, 95, 0.18);
  }

  candyPickup() {
    this.playTone(784, 'sine', 0.1, 0.13, 1174);
    this.playTone(1174, 'triangle', 0.14, 0.13, 1568, 0.06);
  }

  clockChime() {
    // Deep grandfather clock chime
    this.playTone(196.0, 'triangle', 0.65, 0.2);
    this.playTone(392.0, 'sine', 0.55, 0.12);
  }

  midnightVictory() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    fanfare.forEach((n, i) => {
      this.playTone(n, 'triangle', 0.26, 0.18, null, i * 0.12);
    });
  }

  startMusic() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    // Spooky-cute A minor harmonic waltz / platformer loop
    const bassLine = [110, 164.81, 164.81, 123.47, 174.61, 174.61, 130.81, 196.0, 196.0, 110, 164.81, 146.83];
    const melody = [
      440, 0, 523.25, 493.88, 440, 415.3,
      440, 0, 659.25, 587.33, 523.25, 493.88,
      523.25, 0, 698.46, 659.25, 587.33, 523.25,
      493.88, 415.3, 440, 0, 329.63, 415.3
    ];

    const tick = () => {
      if (!this.musicPlaying) return;
      if (!this.muted && this.ctx && this.ctx.state === 'running') {
        const bNote = bassLine[this.step % bassLine.length];
        const mNote = melody[this.step % melody.length];

        if (bNote) {
          this.playTone(bNote, 'triangle', 0.14, 0.055);
        }
        if (mNote) {
          const mult = this.chaseMode ? 1.122 : 1.0; // slight key lift during chase
          this.playTone(mNote * mult, 'sine', 0.12, 0.045);
        }
      }
      this.step++;
      const interval = this.chaseMode ? 165 : 220;
      this.musicTimer = setTimeout(tick, interval);
    };

    tick();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

window.SFX = new SoundEngine();
