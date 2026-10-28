/**
 * Radio static and a tuning "lock" click, generated with the Web Audio API.
 * Volume follows how far the dial is from a station: full hiss between
 * stations, silence when a plan is locked in.
 */

export type RadioStatic = {
  /** 0 = silent, 1 = full static. */
  setLevel: (level: number) => void;
  /** A soft click + short tone when a station locks in. */
  lock: () => void;
  dispose: () => void;
};

export function createRadioStatic(): RadioStatic | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  const ctx = new Ctx();
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1700;
  band.Q.value = 0.5;
  // A slow flutter makes it sound like a real AM/FM search.
  const flutter = ctx.createOscillator();
  const flutterDepth = ctx.createGain();
  flutter.frequency.value = 6;
  flutterDepth.gain.value = 500;
  flutter.connect(flutterDepth).connect(band.frequency);
  const gain = ctx.createGain();
  gain.gain.value = 0;
  noise.connect(band).connect(gain).connect(ctx.destination);
  noise.start();
  flutter.start();

  return {
    setLevel(level) {
      if (ctx.state === "suspended") void ctx.resume();
      gain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.16, ctx.currentTime, 0.05);
    },
    lock() {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    },
    dispose() {
      void ctx.close();
    },
  };
}
