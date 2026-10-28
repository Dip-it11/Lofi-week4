"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createRadioStatic, type RadioStatic } from "./radioStatic";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type Billing = "monthly" | "yearly";

export type RadioPlan = {
  id: string;
  name: string;
  /** Where the plan sits on the dial. Omit to space plans evenly. */
  frequency?: number;
  price: { monthly: number; yearly: number };
  tagline?: string;
  features: string[];
  /** Button text (defaults to "Choose <name>"). */
  cta?: string;
  /** Marks the plan as "Most popular". */
  featured?: boolean;
  /** Visible on the dial but can't be chosen (e.g. "Coming soon"). */
  disabled?: boolean;
};

export type RadioPalette = {
  /** Cabinet colours, outer → inner. */
  body: string;
  bodyInner: string;
  /** Knob rings, dial frame and trim. */
  brass: string;
  /** Dial backlight and button colour. */
  glow: string;
  /** Screen background. */
  screen: string;
  /** Tuning needle. */
  needle: string;
};

export type RadioTunerPricingProps = {
  plans: RadioPlan[];
  /** Plan to tune to on load (defaults to the featured plan, else the first). */
  defaultPlanId?: string;
  defaultBilling?: Billing;
  /** Called with the chosen plan. Return a promise to show a loading state on the button. */
  onSelect?: (plan: RadioPlan, billing: Billing) => void | Promise<void>;
  /** Called whenever a different plan locks in. */
  onTune?: (plan: RadioPlan | null) => void;
  title?: string;
  subtitle?: string;
  currency?: string;
  /** Dial range in MHz. */
  range?: [number, number];
  /** How close (MHz) the needle must be for a plan to come through at all. */
  captureRange?: number;
  /** Start with radio static sound enabled (users can toggle it). */
  defaultSound?: boolean;
  /** Text on the brass name plate. */
  brand?: string;
  palette?: Partial<RadioPalette>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: RadioPalette = {
  body: "#351367",
  bodyInner: "#1d0838",
  brass: "#d9b26f",
  glow: "#ffb347",
  screen: "#0f0619",
  needle: "#ff5a4e",
};

const KNOB_SWEEP = 270; // degrees of knob travel across the whole dial
const DIAL_INSET = 5; // % padding at each end of the dial scale

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** Animated TV/radio snow drawn on a tiny canvas and scaled up. */
function Static({ level, paused }: { level: number; paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = level > 0.02 && !paused;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !active) return;
    const img = ctx.createImageData(canvas.width, canvas.height);
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return;
      last = now;
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = v;
        img.data[i + 1] = v * 0.92;
        img.data[i + 2] = v * 0.85;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return (
    <canvas
      ref={ref}
      width={96}
      height={54}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen [image-rendering:pixelated]"
      style={{ opacity: active ? level * 0.32 : 0, transition: "opacity .2s" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function RadioTunerPricing({
  plans,
  defaultPlanId,
  defaultBilling = "monthly",
  onSelect,
  onTune,
  title,
  subtitle,
  currency = "$",
  range = [88, 108],
  captureRange = 1.4,
  defaultSound = false,
  brand = "LOFISTACK",
  palette: paletteOverrides,
  className = "",
}: RadioTunerPricingProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const [min, max] = range;
  const span = max - min;
  const uid = useId();
  const reduced = usePrefersReducedMotion();

  // Plans with a frequency each (evenly spaced when not given).
  const stations = useMemo(
    () =>
      plans.map((p, i) => ({
        ...p,
        frequency: round1(p.frequency ?? min + span * ((i + 1) / (plans.length + 1))),
      })),
    [plans, min, span],
  );

  const initial = stations.find((s) => s.id === defaultPlanId) ?? stations.find((s) => s.featured) ?? stations[0];
  const [freq, setFreq] = useState(initial?.frequency ?? min + span / 2);
  const [billing, setBilling] = useState<Billing>(defaultBilling);
  const [dragging, setDragging] = useState<"knob" | "dial" | null>(null);
  const [sound, setSound] = useState(defaultSound);
  const [statusState, setStatusState] = useState<{ key: string; value: "idle" | "pending" | "done" | "error" }>({ key: "", value: "idle" });

  // Nearest station and how clearly it comes through.
  const nearest = stations.reduce<(typeof stations)[number] | null>(
    (best, s) => (!best || Math.abs(s.frequency - freq) < Math.abs(best.frequency - freq) ? s : best),
    null,
  );
  const distance = nearest ? Math.abs(nearest.frequency - freq) : Infinity;
  const signal = clamp(1 - distance / captureRange, 0, 1);
  const tuned = distance <= captureRange ? nearest : null;
  const locked = tuned !== null && distance < 0.06;
  /** Dial position (%) — the scale is inset so edge numbers aren't clipped. */
  const toPct = (f: number) => DIAL_INSET + ((f - min) / span) * (100 - DIAL_INSET * 2);
  const pct = toPct(freq);
  const knobAngle = ((freq - min) / span - 0.5) * KNOB_SWEEP;

  /* ---------- Smooth tuning ---------- */

  const freqRef = useRef(freq);
  useEffect(() => {
    freqRef.current = freq;
  }, [freq]);
  const animRef = useRef(0);

  const tuneTo = useCallback(
    (target: number, duration = 650) => {
      cancelAnimationFrame(animRef.current);
      const from = freqRef.current;
      const to = clamp(target, min, max);
      if (reduced || duration === 0) {
        setFreq(to);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setFreq(from + (to - from) * e);
        if (t < 1) animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    },
    [min, max, reduced],
  );
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  /** Magnetic lock: when released near a station, glide onto it. */
  const settle = useCallback(() => {
    const f = freqRef.current;
    const near = stations.reduce((b, s) => (Math.abs(s.frequency - f) < Math.abs(b.frequency - f) ? s : b), stations[0]);
    if (near && Math.abs(near.frequency - f) <= captureRange) tuneTo(near.frequency, 320);
  }, [stations, captureRange, tuneTo]);

  /* ---------- Sound ---------- */

  const staticRef = useRef<RadioStatic | null>(null);
  useEffect(() => {
    if (!sound) {
      staticRef.current?.setLevel(0);
      return;
    }
    staticRef.current ??= createRadioStatic();
  }, [sound]);
  useEffect(() => {
    if (sound) staticRef.current?.setLevel(locked ? 0 : 1 - signal * 0.85);
  }, [sound, signal, locked]);
  useEffect(() => () => staticRef.current?.dispose(), []);

  // Lock-in feedback + onTune.
  const lastLocked = useRef<string | null>(locked ? (tuned?.id ?? null) : null);
  const onTuneRef = useRef(onTune);
  useEffect(() => {
    onTuneRef.current = onTune;
  }, [onTune]);
  useEffect(() => {
    const id = locked ? (tuned?.id ?? null) : null;
    if (id === lastLocked.current) return;
    lastLocked.current = id;
    if (id && sound) staticRef.current?.lock();
    onTuneRef.current?.(id ? (stations.find((s) => s.id === id) ?? null) : null);
  }, [locked, tuned, sound, stations]);

  /* ---------- Knob dragging (rotate around its centre) ---------- */

  const knobRef = useRef<HTMLDivElement>(null);
  const lastAngle = useRef(0);
  const angleAt = (e: ReactPointerEvent) => {
    const r = knobRef.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const onKnobDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(animRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    lastAngle.current = angleAt(e);
    setDragging("knob");
  };
  const onKnobMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging !== "knob") return;
    const a = angleAt(e);
    let d = a - lastAngle.current;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    lastAngle.current = a;
    setFreq((f) => clamp(f + ((d * 180) / Math.PI / KNOB_SWEEP) * span, min, max));
  };

  /* ---------- Dial dragging (slide the needle) ---------- */

  const dialRef = useRef<HTMLDivElement>(null);
  const freqAtX = (clientX: number) => {
    const r = dialRef.current!.getBoundingClientRect();
    const t = ((clientX - r.left) / r.width * 100 - DIAL_INSET) / (100 - DIAL_INSET * 2);
    return clamp(min + t * span, min, max);
  };
  const onDialDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(animRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging("dial");
    setFreq(freqAtX(e.clientX));
  };
  const onDialMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging === "dial") setFreq(freqAtX(e.clientX));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(null);
    settle();
  };

  /* ---------- Keyboard ---------- */

  const jump = (dir: 1 | -1) => {
    const sorted = [...stations].sort((a, b) => a.frequency - b.frequency);
    const f = freqRef.current;
    const next = dir > 0 ? sorted.find((s) => s.frequency > f + 0.05) : [...sorted].reverse().find((s) => s.frequency < f - 0.05);
    if (next) tuneTo(next.frequency);
  };
  const onKnobKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const fine = e.shiftKey ? 1 : 0.2;
    const keys: Record<string, () => void> = {
      ArrowRight: () => tuneTo(freqRef.current + fine, 120),
      ArrowUp: () => tuneTo(freqRef.current + fine, 120),
      ArrowLeft: () => tuneTo(freqRef.current - fine, 120),
      ArrowDown: () => tuneTo(freqRef.current - fine, 120),
      PageUp: () => jump(1),
      PageDown: () => jump(-1),
      Home: () => tuneTo(min),
      End: () => tuneTo(max),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  };
  const onKnobKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key.startsWith("Arrow")) settle();
  };

  /* ---------- Choose ---------- */

  // Button status belongs to one plan + billing combination; tuning away resets it.
  const statusKey = `${tuned?.id ?? ""}|${billing}`;
  const status = statusState.key === statusKey ? statusState.value : "idle";

  const choose = async () => {
    if (!tuned || !locked || tuned.disabled || status === "pending") return;
    const key = statusKey;
    try {
      const result = onSelect?.(tuned, billing);
      if (result instanceof Promise) {
        setStatusState({ key, value: "pending" });
        await result;
      }
      setStatusState({ key, value: "done" });
    } catch {
      setStatusState({ key, value: "error" });
    }
  };

  /* ---------- Render helpers ---------- */

  const priceText = (p: RadioPlan) => {
    const value = p.price[billing];
    if (value === 0) return { main: "Free", per: "forever" };
    return { main: `${currency}${value}`, per: billing === "monthly" ? "/ month" : "/ year" };
  };
  const yearlySaving = useMemo(() => {
    const paid = stations.filter((s) => s.price.monthly > 0);
    if (!paid.length) return 0;
    const best = Math.max(...paid.map((s) => 1 - s.price.yearly / (s.price.monthly * 12)));
    return Math.round(best * 100);
  }, [stations]);

  const ticks = useMemo(() => {
    const out: { f: number; major: boolean }[] = [];
    for (let f = Math.ceil(min * 2) / 2; f <= max + 1e-6; f += 0.5) out.push({ f: round1(f), major: Math.abs(f % 2) < 1e-6 });
    return out;
  }, [min, max]);

  const valueText = tuned
    ? `${freq.toFixed(1)} FM — ${tuned.name}, ${priceText(tuned).main} ${priceText(tuned).per}${locked ? "" : " (weak signal)"}`
    : `${freq.toFixed(1)} FM — no signal`;

  const style = {
    "--rtp-body": palette.body,
    "--rtp-inner": palette.bodyInner,
    "--rtp-brass": palette.brass,
    "--rtp-glow": palette.glow,
    "--rtp-screen": palette.screen,
    "--rtp-needle": palette.needle,
  } as CSSProperties;

  const clarity = locked ? 1 : signal;
  const shown = tuned;

  return (
    <section style={style} className={`rtp @container w-full ${className}`} aria-labelledby={title ? `${uid}-title` : undefined}>
      {(title || subtitle) && (
        <header className="mx-auto mb-8 max-w-2xl text-center @xl:mb-10">
          {title && (
            <h2 id={`${uid}-title`} className="text-3xl font-semibold tracking-tight text-[var(--rtp-body)] @xl:text-4xl">
              {title}
            </h2>
          )}
          {subtitle && <p className="mt-3 text-base text-[#5d5275] @xl:text-lg">{subtitle}</p>}
        </header>
      )}

      {/* Cabinet */}
      <div className="relative mx-auto max-w-4xl">
        {/* carry handle */}
        <div aria-hidden="true" className="mx-auto h-5 w-40 rounded-t-2xl border-[5px] border-b-0 border-[var(--rtp-brass)]/80 @xl:w-56" />
        <div className="rounded-[28px] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--rtp-body)_85%,white),var(--rtp-body)_45%,color-mix(in_srgb,var(--rtp-body)_70%,black))] p-2.5 shadow-[0_30px_60px_-25px_rgba(30,8,60,.65)] ring-1 ring-black/20 @xl:p-3.5">
          <div className="grid gap-4 rounded-[22px] bg-[var(--rtp-inner)] p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,.5)] @xl:p-6 @3xl:grid-cols-[140px_1fr_168px] @3xl:gap-6">
            {/* Speaker */}
            <div aria-hidden="true" className="hidden flex-col items-center justify-between gap-4 @3xl:flex">
              <div
                className={`w-full flex-1 rounded-2xl border-4 border-[var(--rtp-brass)]/60 bg-[radial-gradient(circle,rgba(0,0,0,.55)_1.6px,transparent_2px)] bg-[length:9px_9px] ${
                  locked && !reduced ? "rtp-thump" : ""
                }`}
                style={{ backgroundColor: "color-mix(in srgb, var(--rtp-body) 60%, black)" }}
              />
              <div className="w-full rounded-md bg-[linear-gradient(180deg,#f3d9a4,var(--rtp-brass))] px-2 py-1.5 text-center text-[10px] font-bold tracking-[0.25em] text-[#3b2410] shadow-inner">
                {brand}
              </div>
            </div>

            {/* Dial + screen */}
            <div className="flex min-w-0 flex-col gap-4">
              {/* Dial window */}
              <div
                ref={dialRef}
                onPointerDown={onDialDown}
                onPointerMove={onDialMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                aria-hidden="true"
                className={`relative h-20 touch-none overflow-hidden rounded-xl border-2 border-[var(--rtp-brass)]/70 select-none @xl:h-24 ${
                  dragging === "dial" ? "cursor-grabbing" : "cursor-pointer"
                }`}
                style={{
                  background: `radial-gradient(120% 140% at ${pct}% 110%, color-mix(in srgb, var(--rtp-glow) 75%, transparent), color-mix(in srgb, var(--rtp-glow) 22%, #1a0c04) 55%, #120802)`,
                }}
              >
                {/* station labels */}
                {stations.map((s) => {
                  const x = toPct(s.frequency);
                  const on = tuned?.id === s.id;
                  return (
                    <span
                      key={s.id}
                      className="absolute top-2 -translate-x-1/2 text-[10px] font-bold tracking-[0.18em] whitespace-nowrap uppercase transition-[color,text-shadow] @xl:top-2.5 @xl:text-xs"
                      style={{
                        left: `${x}%`,
                        color: on ? "#fff6e0" : "rgba(255,230,190,.55)",
                        textShadow: on ? `0 0 ${6 + 10 * clarity}px var(--rtp-glow)` : "none",
                      }}
                    >
                      {s.featured ? "★ " : ""}
                      {s.name}
                    </span>
                  );
                })}
                {/* scale */}
                {ticks.map(({ f, major }) => (
                  <span
                    key={f}
                    className="absolute bottom-5 w-px -translate-x-1/2 bg-[#ffe7c2]/60 @xl:bottom-6"
                    style={{ left: `${toPct(f)}%`, height: major ? 14 : 7 }}
                  />
                ))}
                {ticks
                  .filter((t) => t.major)
                  .map(({ f }) => (
                    <span
                      key={`n${f}`}
                      className="absolute bottom-1 -translate-x-1/2 font-mono text-[9px] text-[#ffe7c2]/70 @xl:bottom-1.5 @xl:text-[10px]"
                      style={{ left: `${toPct(f)}%` }}
                    >
                      {f}
                    </span>
                  ))}
                {/* needle */}
                <span
                  className="absolute top-1 bottom-1 w-[3px] -translate-x-1/2 rounded-full bg-[var(--rtp-needle)] shadow-[0_0_10px_var(--rtp-needle)]"
                  style={{ left: `${pct}%` }}
                />
                {/* glass reflection */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
              </div>

              {/* Screen */}
              <div
                className="relative flex min-h-[400px] flex-col overflow-hidden rounded-xl border border-black/40 bg-[var(--rtp-screen)] p-5 shadow-[inset_0_0_30px_rgba(0,0,0,.8)] @xl:min-h-[350px] @xl:p-6"
              >
                {/* readout row */}
                <div className="flex items-center justify-between gap-3 font-mono text-xs tracking-[0.2em] text-[var(--rtp-glow)] uppercase [text-shadow:0_0_8px_var(--rtp-glow)]">
                  <span>
                    {freq.toFixed(1)} FM{shown ? ` · ${shown.name}` : ""}
                  </span>
                  <span className="flex items-end gap-[3px]" aria-label={`Signal ${Math.round(clarity * 100)} percent`} role="img">
                    {[0.15, 0.35, 0.55, 0.75, 0.95].map((th, i) => (
                      <span
                        key={i}
                        className="w-[4px] rounded-sm"
                        style={{ height: 5 + i * 3, background: clarity >= th ? "var(--rtp-glow)" : "rgba(255,255,255,.15)" }}
                      />
                    ))}
                  </span>
                </div>

                {shown ? (
                  <div
                    className={`mt-5 ${!locked && !reduced ? "rtp-jitter" : ""}`}
                    style={{ filter: locked ? "none" : `blur(${((1 - clarity) * 5).toFixed(2)}px)`, opacity: 0.35 + 0.65 * clarity }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold text-white @xl:text-3xl">{shown.name}</h3>
                      {shown.featured && (
                        <span className="rounded-full bg-[var(--rtp-glow)]/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--rtp-glow)] uppercase ring-1 ring-[var(--rtp-glow)]/40">
                          Most popular
                        </span>
                      )}
                      {shown.disabled && (
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white/70 uppercase">Coming soon</span>
                      )}
                    </div>
                    {shown.tagline && <p className="mt-1 text-sm text-white/65">{shown.tagline}</p>}
                    <p className="mt-4 flex items-baseline gap-2 text-white">
                      <span className="text-4xl font-bold tracking-tight @xl:text-5xl">{priceText(shown).main}</span>
                      <span className="text-sm text-white/60">{priceText(shown).per}</span>
                      {billing === "yearly" && shown.price.monthly > 0 && (
                        <span className="text-xs text-[var(--rtp-glow)]">
                          ≈ {currency}
                          {(shown.price.yearly / 12).toFixed(shown.price.yearly % 12 ? 2 : 0)}/mo
                        </span>
                      )}
                    </p>
                    <ul className="mt-4 grid gap-2 text-sm text-white/85 @xl:grid-cols-2">
                      {shown.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-[var(--rtp-glow)]" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                            <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="my-auto py-8 text-center">
                    <p className="font-mono text-lg tracking-[0.3em] text-white/70 uppercase">Searching…</p>
                    <p className="mt-2 text-sm text-white/50">No signal. Turn the knob or press a preset to tune in a plan.</p>
                  </div>
                )}

                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={choose}
                    disabled={!locked || !!shown?.disabled}
                    aria-busy={status === "pending" || undefined}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--rtp-glow)] px-6 py-3 text-sm font-bold text-[#2a1404] shadow-[0_0_24px_-4px_var(--rtp-glow)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--rtp-glow)] active:translate-y-0 active:brightness-95 aria-busy:cursor-wait aria-busy:hover:translate-y-0 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45 disabled:shadow-none disabled:hover:translate-y-0 @xl:w-auto @xl:text-base"
                  >
                    {status === "pending" ? (
                      <>
                        <svg viewBox="0 0 24 24" className="size-4 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                          <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                        </svg>
                        Tuning in…
                      </>
                    ) : status === "done" ? (
                      <>
                        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                          <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {shown?.name} selected
                      </>
                    ) : status === "error" ? (
                      "Something went wrong · try again"
                    ) : !shown ? (
                      "Tune to a plan"
                    ) : !locked ? (
                      "Fine-tune to lock in…"
                    ) : shown.disabled ? (
                      "Coming soon"
                    ) : (
                      (shown.cta ?? `Choose ${shown.name}`)
                    )}
                  </button>
                </div>

                {/* scanlines + static */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.035)_0_1px,transparent_1px_3px)]" />
                <Static level={1 - clarity} paused={reduced} />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-row flex-wrap items-center justify-center gap-5 @3xl:flex-col @3xl:justify-start">
              <div className="flex flex-col items-center gap-2">
                <div
                  ref={knobRef}
                  role="slider"
                  tabIndex={0}
                  aria-label="Tuning knob"
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={round1(freq)}
                  aria-valuetext={valueText}
                  aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown"
                  onPointerDown={onKnobDown}
                  onPointerMove={onKnobMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={onKnobKey}
                  onKeyUp={onKnobKeyUp}
                  className={`relative size-28 touch-none rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3d6,var(--rtp-brass)_45%,color-mix(in_srgb,var(--rtp-brass)_55%,black))] p-2 shadow-[0_8px_18px_rgba(0,0,0,.45)] transition-shadow outline-none select-none focus-visible:ring-4 focus-visible:ring-[var(--rtp-glow)]/70 @xl:size-32 ${
                    dragging === "knob" ? "cursor-grabbing" : "cursor-grab hover:shadow-[0_10px_24px_rgba(0,0,0,.55)]"
                  }`}
                >
                  <div
                    className="relative size-full rounded-full shadow-[inset_0_2px_6px_rgba(255,255,255,.25),inset_0_-4px_8px_rgba(0,0,0,.5)]"
                    style={{
                      transform: `rotate(${knobAngle}deg)`,
                      background:
                        "repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--rtp-body) 70%, black) 0deg 6deg, color-mix(in srgb, var(--rtp-body) 85%, white) 6deg 12deg)",
                    }}
                  >
                    <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle_at_40%_35%,color-mix(in_srgb,var(--rtp-body)_70%,white),var(--rtp-body))] shadow-inner" />
                    <span className="absolute top-[7%] left-1/2 h-[24%] w-[5px] -translate-x-1/2 rounded-full bg-[var(--rtp-glow)] shadow-[0_0_8px_var(--rtp-glow)]" />
                  </div>
                </div>
                <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--rtp-brass)]/80 uppercase">Tuning</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                {/* Presets */}
                <div role="group" aria-label="Plan presets" className="flex gap-1.5">
                  {stations.map((s, i) => {
                    const on = locked && tuned?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => tuneTo(s.frequency, 800)}
                        aria-pressed={on}
                        aria-label={`Tune to ${s.name}`}
                        className={`flex h-11 min-w-11 flex-col items-center justify-center rounded-lg border px-2 text-[10px] leading-tight font-bold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rtp-glow)] active:translate-y-px ${
                          on
                            ? "border-[var(--rtp-glow)] bg-[var(--rtp-glow)] text-[#2a1404] shadow-[0_0_14px_-2px_var(--rtp-glow)]"
                            : "border-white/15 bg-white/5 text-white/75 hover:bg-white/12 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">{i + 1}</span>
                        <span className="max-w-14 truncate tracking-wide">{s.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Billing switch */}
                <div role="radiogroup" aria-label="Billing period" className="flex rounded-full bg-black/35 p-1 ring-1 ring-white/10">
                  {(["monthly", "yearly"] as const).map((b) => (
                    <button
                      key={b}
                      type="button"
                      role="radio"
                      aria-checked={billing === b}
                      onClick={() => setBilling(b)}
                      className={`h-9 rounded-full px-3 text-[11px] font-bold tracking-wider uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rtp-glow)] ${
                        billing === b ? "bg-[var(--rtp-brass)] text-[#2a1404]" : "text-white/65 hover:text-white"
                      }`}
                    >
                      {b}
                      {b === "yearly" && yearlySaving > 0 && <span className="ml-1 opacity-80">−{yearlySaving}%</span>}
                    </button>
                  ))}
                </div>

                {/* Sound */}
                <button
                  type="button"
                  onClick={() => setSound((s) => !s)}
                  aria-pressed={sound}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold tracking-wider text-white/70 uppercase ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rtp-glow)]"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                    {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6m0-6-5 6" />}
                  </svg>
                  Static {sound ? "on" : "off"}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* feet */}
        <div aria-hidden="true" className="mx-10 flex justify-between">
          <span className="h-2.5 w-14 rounded-b-lg bg-[color-mix(in_srgb,var(--rtp-body)_60%,black)]" />
          <span className="h-2.5 w-14 rounded-b-lg bg-[color-mix(in_srgb,var(--rtp-body)_60%,black)]" />
        </div>
      </div>

      {/* Announce only when a plan locks in, not on every step of the dial */}
      <p className="sr-only" aria-live="polite">
        {locked && tuned ? `Tuned to ${tuned.name}: ${priceText(tuned).main} ${priceText(tuned).per}.` : ""}
      </p>
      <p className="sr-only">
        Use the tuning knob with the arrow keys to fine-tune, Page Up and Page Down to jump between plans, or press a preset button.
      </p>

      <style>{`
        @keyframes rtp-jitter { 0%,100% { transform: translate(0,0) } 25% { transform: translate(-1.5px,.5px) } 50% { transform: translate(1px,-1px) } 75% { transform: translate(-.5px,1px) } }
        .rtp .rtp-jitter { animation: rtp-jitter .18s steps(2) infinite; }
        @keyframes rtp-thump { 0%,100% { transform: scale(1) } 50% { transform: scale(1.025) } }
        .rtp .rtp-thump { animation: rtp-thump .8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .rtp .rtp-jitter, .rtp .rtp-thump { animation: none } }
      `}</style>
    </section>
  );
}

export default RadioTunerPricing;
