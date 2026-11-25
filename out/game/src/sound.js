// Sizzle & Serve — Warung Rush, v2: a few WebAudio blips, no files.
// Sound is synthesized at play time, so the game loads nothing at all.
export class Sfx {
  constructor() { this.ctx = null; this.muted = false; }
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* silent */ }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  blip(freq) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + 0.15);
  }
  served() { this.blip(880); setTimeout(() => this.blip(1174), 90); }
  wrong() { this.blip(160); setTimeout(() => this.blip(120), 110); }
  bell() { this.blip(980); setTimeout(() => this.blip(980), 160); }
}
