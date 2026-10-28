/**
 * A tiny lofi beat generator built on the Web Audio API — no audio files.
 * Jazzy 7th/9th chords on a soft electric-piano voice, a swung boom-bap
 * kit, warm low-pass filtering, tape wobble and vinyl crackle.
 */

export type LofiSynth = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  dispose: () => void;
};

const BPM = 74;
const BEAT = 60 / BPM;
const SWING = 0.12; // delay applied to off-beat 8ths, in beats

// ii–V–I–vi in C, voiced as MIDI notes (one chord per bar).
const CHORDS = [
  [50, 57, 60, 64, 65], // Dm9
  [43, 53, 57, 59, 64], // G13
  [48, 55, 59, 62, 64], // Cmaj9
  [45, 55, 60, 64, 67], // Am9
];

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function noiseBuffer(ctx: AudioContext, seconds: number, crackle = false) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    if (crackle) {
      // Mostly silence with sparse pops and a faint hiss.
      const pop = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0;
      last = last * 0.6 + pop;
      data[i] = last + (Math.random() * 2 - 1) * 0.012;
    } else {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

export function createLofiSynth(): LofiSynth | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  const warmth = ctx.createBiquadFilter();
  warmth.type = "lowpass";
  warmth.frequency.value = 2200;
  warmth.Q.value = 0.4;
  warmth.connect(master).connect(ctx.destination);

  // Tape wobble: a slow LFO detunes every piano voice.
  const wobble = ctx.createOscillator();
  const wobbleDepth = ctx.createGain();
  wobble.frequency.value = 0.35;
  wobbleDepth.gain.value = 7; // cents
  wobble.connect(wobbleDepth);
  wobble.start();

  // Vinyl crackle loop.
  const crackle = ctx.createBufferSource();
  crackle.buffer = noiseBuffer(ctx, 4, true);
  crackle.loop = true;
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.5;
  crackle.connect(crackleGain).connect(warmth);
  crackle.start();

  const hiss = noiseBuffer(ctx, 1);

  const piano = (freq: number, time: number, dur: number, vel: number) => {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, time);
    out.gain.exponentialRampToValueAtTime(vel, time + 0.03);
    out.gain.exponentialRampToValueAtTime(vel * 0.35, time + 0.6);
    out.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    out.connect(warmth);
    for (const [type, mult, gain] of [
      ["sine", 1, 1],
      ["triangle", 2, 0.18],
      ["sine", 3, 0.06],
    ] as const) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      osc.detune.value = (Math.random() - 0.5) * 6;
      wobbleDepth.connect(osc.detune);
      g.gain.value = gain;
      osc.connect(g).connect(out);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    }
  };

  const kick = (time: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.18);
    g.gain.setValueAtTime(0.9, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(g).connect(warmth);
    osc.start(time);
    osc.stop(time + 0.4);
  };

  const noiseHit = (time: number, type: BiquadFilterType, freq: number, dur: number, vel: number) => {
    const src = ctx.createBufferSource();
    src.buffer = hiss;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(f).connect(g).connect(warmth);
    src.start(time);
    src.stop(time + dur + 0.02);
  };

  // Look-ahead scheduler: queue notes slightly ahead of the audio clock.
  let step = 0; // 8th-note index
  let nextTime = 0;
  let timer: number | null = null;

  const schedule = () => {
    while (nextTime < ctx.currentTime + 0.15) {
      const beatInBar = (step % 8) / 2;
      const bar = Math.floor(step / 8) % CHORDS.length;
      const offbeat = step % 2 === 1;
      const t = nextTime + (offbeat ? SWING * BEAT : 0);

      if (step % 8 === 0) {
        CHORDS[bar].forEach((n, i) => piano(midiToHz(n), t + i * 0.012, BEAT * 3.6, i === 0 ? 0.11 : 0.07));
      }
      if (step % 8 === 5) {
        // a soft re-strike of the top two notes for movement
        CHORDS[bar].slice(-2).forEach((n) => piano(midiToHz(n), t, BEAT * 1.4, 0.04));
      }
      if (beatInBar === 0 || step % 8 === 5) kick(t);
      if (beatInBar === 1 || beatInBar === 3) noiseHit(t, "bandpass", 1800, 0.18, 0.28);
      noiseHit(t, "highpass", 7000, offbeat ? 0.04 : 0.06, offbeat ? 0.05 : 0.08);

      step += 1;
      nextTime += BEAT / 2;
    }
  };

  return {
    async play() {
      await ctx.resume();
      if (timer === null) {
        nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
        timer = window.setInterval(schedule, 25);
        schedule();
      }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.25);
    },
    async pause() {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      await new Promise((r) => setTimeout(r, 250));
      if (timer === null) await ctx.suspend();
    },
    dispose() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      void ctx.close();
    },
  };
}
