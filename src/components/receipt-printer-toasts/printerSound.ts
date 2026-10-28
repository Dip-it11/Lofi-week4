/**
 * Thermal printer sounds made with the Web Audio API — no audio files.
 * feed:  motor hum + rapid print-head ticks while a receipt prints.
 * beep:  a short status beep when it finishes (two low beeps for errors).
 * tear:  a quick paper rip.
 */

export type PrinterSound = {
  feed: (ms: number) => void;
  beep: (kind: "success" | "error" | "warning" | "info") => void;
  tear: () => void;
  dispose: () => void;
};

export function createPrinterSound(): PrinterSound | null {
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

  const burst = (ctx: AudioContext, buf: AudioBuffer, at: number, len: number, freq: number, vol: number, type: BiquadFilterType = "bandpass") => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 2.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(at, Math.random() * 0.5);
    src.stop(at + len + 0.02);
  };

  const tone = (ctx: AudioContext, at: number, freq: number, len: number, vol: number, type: OscillatorType = "square") => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.005);
    g.gain.setValueAtTime(vol, at + len - 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(ctx.destination);
    o.start(at);
    o.stop(at + len + 0.02);
  };

  return {
    feed(ms) {
      const { ctx, noise } = get();
      const t = ctx.currentTime;
      const len = ms / 1000;
      // motor
      const motor = ctx.createOscillator();
      motor.type = "sawtooth";
      motor.frequency.value = 96;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 380;
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(0.0001, t);
      mg.gain.exponentialRampToValueAtTime(0.03, t + 0.04);
      mg.gain.setValueAtTime(0.03, t + len - 0.05);
      mg.gain.exponentialRampToValueAtTime(0.0001, t + len);
      motor.connect(lp).connect(mg).connect(ctx.destination);
      motor.start(t);
      motor.stop(t + len + 0.05);
      // print head ticks
      for (let x = 0.02; x < len - 0.02; x += 0.034) burst(ctx, noise, t + x, 0.018, 3200 + Math.random() * 600, 0.07);
    },
    beep(kind) {
      const { ctx } = get();
      const t = ctx.currentTime;
      if (kind === "error") {
        tone(ctx, t, 420, 0.09, 0.05);
        tone(ctx, t + 0.15, 420, 0.09, 0.05);
      } else if (kind === "warning") {
        tone(ctx, t, 1150, 0.12, 0.04);
      } else {
        tone(ctx, t, kind === "success" ? 2100 : 1700, 0.06, 0.035);
      }
    },
    tear() {
      const { ctx, noise } = get();
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(700, t);
      hp.frequency.exponentialRampToValueAtTime(5000, t + 0.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      src.connect(hp).connect(g).connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.25);
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}
