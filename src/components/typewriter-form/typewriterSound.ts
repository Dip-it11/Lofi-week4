/**
 * Typewriter foley made with the Web Audio API — no audio files.
 * clack: a key strike · ding: the end-of-line bell · zip: the carriage return / paper pull.
 */

export type TypewriterSound = {
  clack: () => void;
  ding: () => void;
  zip: () => void;
  dispose: () => void;
};

export function createTypewriterSound(): TypewriterSound | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  out.connect(ctx.destination);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

  const burst = (t: number, freq: number, q: number, dur: number, vel: number, type: BiquadFilterType = "bandpass") => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  };

  const wake = () => {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx.currentTime;
  };

  return {
    clack() {
      const t = wake();
      const pitch = 2200 + Math.random() * 900;
      burst(t, pitch, 1.2, 0.045, 0.5);
      // the type bar hitting the platen
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.05);
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + 0.07);
    },
    ding() {
      const t = wake();
      for (const [f, v] of [
        [2093, 0.22],
        [4186, 0.06],
        [6279, 0.025],
      ]) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.connect(g).connect(out);
        osc.start(t);
        osc.stop(t + 1.5);
      }
    },
    zip() {
      const t = wake();
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 3;
      f.frequency.setValueAtTime(600, t);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(f).connect(g).connect(out);
      src.start(t);
      src.stop(t + 0.45);
      // ratchet clicks
      for (let i = 0; i < 6; i++) burst(t + i * 0.055, 3500, 4, 0.02, 0.25);
    },
    dispose() {
      void ctx.close();
    },
  };
}
