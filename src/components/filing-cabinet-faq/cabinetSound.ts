/**
 * Filing cabinet sounds made with the Web Audio API — no audio files.
 * slide:  a metal drawer rolling on its runners, ending in a soft clunk.
 * rattle: a locked drawer shaking against its latch.
 */

export type CabinetSound = {
  slide: (opening: boolean) => void;
  rattle: () => void;
  dispose: () => void;
};

export function createCabinetSound(): CabinetSound | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  let ctx: AudioContext | null = null;
  let noise: AudioBuffer | null = null;
  const get = () => {
    if (!ctx) {
      ctx = new Ctx();
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    void ctx.resume();
    return { ctx, noise: noise! };
  };

  const clunk = (ctx: AudioContext, buf: AudioBuffer, at: number, vol: number) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, at);
    o.frequency.exponentialRampToValueAtTime(48, at + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(g).connect(ctx.destination);
    o.start(at);
    o.stop(at + 0.2);
    // metal click on top
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2400;
    bp.Q.value = 6;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(vol * 0.5, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(bp).connect(cg).connect(ctx.destination);
    src.start(at, Math.random() * 0.5);
    src.stop(at + 0.06);
  };

  return {
    slide(opening) {
      const { ctx, noise } = get();
      const t = ctx.currentTime;
      const len = opening ? 0.34 : 0.26;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "bandpass";
      lp.Q.value = 1.2;
      lp.frequency.setValueAtTime(opening ? 380 : 620, t);
      lp.frequency.linearRampToValueAtTime(opening ? 620 : 380, t + len);
      // runner bearings: a fast wobble on the gain
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
      g.gain.setValueAtTime(0.16, t + len - 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      const wob = ctx.createOscillator();
      wob.frequency.value = 38;
      const wobDepth = ctx.createGain();
      wobDepth.gain.value = 0.05;
      wob.connect(wobDepth).connect(g.gain);
      src.connect(lp).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + len + 0.02);
      wob.start(t);
      wob.stop(t + len + 0.02);
      clunk(ctx, noise, t + len, opening ? 0.18 : 0.26);
    },
    rattle() {
      const { ctx, noise } = get();
      const t = ctx.currentTime;
      [0, 0.07, 0.13, 0.2].forEach((d, i) => clunk(ctx, noise, t + d, 0.1 - i * 0.015));
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}
