/**
 * Film projector sounds made with the Web Audio API — no audio files.
 * whirr: the motor and shutter running (loops while the lightbox is open).
 * clack: the film advancing one frame.
 */

export type ProjectorSound = {
  start: () => void;
  stop: () => void;
  clack: () => void;
  dispose: () => void;
};

export function createProjectorSound(): ProjectorSound | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();

  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Motor: low-passed noise, chopped by a 24 Hz "shutter".
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 900;
  const shutter = ctx.createGain();
  shutter.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 24;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.35;
  lfo.connect(lfoDepth).connect(shutter.gain);
  const hum = ctx.createOscillator();
  hum.frequency.value = 60;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.15;
  const master = ctx.createGain();
  master.gain.value = 0;
  noise.connect(low).connect(shutter).connect(master);
  hum.connect(humGain).connect(master);
  master.connect(ctx.destination);
  noise.start();
  lfo.start();
  hum.start();

  return {
    start() {
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.09, ctx.currentTime, 0.25);
    },
    stop() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    },
    clack() {
      void ctx.resume();
      const t = ctx.currentTime;
      for (const [delay, f] of [
        [0, 2600],
        [0.045, 1800],
      ]) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = f;
        bp.Q.value = 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35, t + delay);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.05);
        src.connect(bp).connect(g).connect(ctx.destination);
        src.start(t + delay, Math.random());
        src.stop(t + delay + 0.06);
      }
    },
    dispose() {
      void ctx.close();
    },
  };
}
