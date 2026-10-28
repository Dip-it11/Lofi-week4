"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEventHandler,
} from "react";
import {
  DEFAULT_CAT_PALETTE,
  SITTER_EXTENT,
  SITTER_ORIGIN,
  STRIDE_DISTANCE,
  Sitter,
  WALKER_EXTENT,
  WALKER_ORIGIN,
  Walker,
  type CatArt,
  type CatPalette,
} from "./BlackCat";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type HeroAction = {
  label: string;
  href: string;
  /** Accessible name when the visible label is not descriptive enough. */
  ariaLabel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type HeroColors = {
  /** Company name colour. */
  brand: string;
  /** Section background. */
  background: string;
  /** Tagline / body copy. */
  text: string;
  /** Text colour on the primary button. */
  onBrand: string;
};

export type { CatPalette };

export type CatRevealHeroProps = {
  /** The name revealed behind the cat. Also the page heading. */
  companyName?: string;
  /** Render the name in capitals (default `true`). */
  uppercase?: boolean;
  /** Small label above the name. */
  eyebrow?: string;
  /** Supporting line under the name. */
  tagline?: string;
  primaryAction?: HeroAction;
  secondaryAction?: HeroAction;
  colors?: Partial<HeroColors>;
  /** Recolour the cat (defaults to the original black cat). */
  catPalette?: Partial<CatPalette>;
  /** Seconds for the cat to walk in and reach its seat after the name. */
  duration?: number;
  /** Start on mount, or when the hero scrolls into view. */
  trigger?: "mount" | "in-view";
  loop?: boolean;
  /** Pause between loops, in seconds. */
  loopDelay?: number;
  /** Show a replay button once the cat has sat down. */
  showReplay?: boolean;
  /** `"auto"` follows the OS setting; `"always"` / `"never"` force it (handy for previews). */
  reducedMotion?: "auto" | "always" | "never";
  /** Font stack for the name. Tall, condensed faces work best. */
  fontFamily?: string;
  /** Heading level for the name. */
  headingLevel?: "h1" | "h2";
  /** Any CSS length, e.g. `"70svh"` or `"560px"`. */
  minHeight?: string;
  className?: string;
  onComplete?: () => void;
};

type Phase = "waiting" | "playing" | "done";
type Status = "preparing" | "idle" | Exclude<Phase, "waiting">;

type Layout = {
  width: number;
  height: number;
  baseline: number;
  textLeft: number;
  textRight: number;
  /** Left edge of the seat reserved after the name. */
  seatLeft: number;
  cap: number;
  letters: { left: number; width: number }[];
};

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_COLORS: HeroColors = {
  brand: "#351367",
  background: "#ffffff",
  text: "#4a3a66",
  onBrand: "#ffffff",
};

/** Sitting cat height relative to the letters' cap height. */
const CAT_TO_CAP = 1.05;
/** Cap height of the default face (Bebas Neue) as a fraction of font size. */
const CAP_RATIO = 0.7;
/** Width reserved after the name for the sitting cat, in em. */
const SEAT_EM = 0.72;
/** Where the reveal edge trails the walker, in artboard units behind its front paws. */
const REVEAL_TRAIL = -150;
/** Sit-down choreography, seconds after the walk ends. */
const SIT = { settle: 0.5, tiltStart: 0.02, tilt: 0.38, fadeStart: 0.18, fade: 0.3, reveal: 0.7, total: 1.05 };

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const progress = (t: number, start: number, dur: number) => clamp((t - start) / dur);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

/** Cruise at constant speed, then slow to a gentle stop (f'(1) = 0). */
function easeWalk(u: number, cruise = 0.7) {
  const x = clamp(u);
  const v = 1 / (cruise + (1 - cruise) / 2);
  if (x <= cruise) return v * x;
  const d = x - cruise;
  return v * cruise + v * (d - (d * d) / (2 * (1 - cruise)));
}

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

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function CatRevealHero({
  companyName = "Lofistack",
  uppercase = true,
  eyebrow,
  tagline,
  primaryAction,
  secondaryAction,
  colors: colorOverrides,
  catPalette,
  duration = 5,
  trigger = "in-view",
  loop = false,
  loopDelay = 2.5,
  showReplay = true,
  reducedMotion = "auto",
  fontFamily = 'var(--font-display, "Bebas Neue"), "Oswald", Impact, "Arial Narrow", sans-serif',
  headingLevel = "h1",
  minHeight = "min(78svh, 760px)",
  className = "",
  onComplete,
}: CatRevealHeroProps) {
  const colors = { ...DEFAULT_COLORS, ...colorOverrides };
  const paletteKey = JSON.stringify(catPalette ?? {});
  // Stable object so the memoised art paths don't re-render every frame.
  const palette = useMemo<CatPalette>(
    () => ({ ...DEFAULT_CAT_PALETTE, ...(JSON.parse(paletteKey) as Partial<CatPalette>) }),
    [paletteKey],
  );
  const name = companyName.trim() || "Lofistack";
  const chars = Array.from(uppercase ? name.toUpperCase() : name);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const seatRef = useRef<HTMLSpanElement>(null);
  const baselineRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const osReduced = usePrefersReducedMotion();
  const reduced = reducedMotion === "always" || (reducedMotion === "auto" && osReduced);

  /* ---------- Load artwork lazily (keeps it out of the initial bundle) ---------- */

  const [art, setArt] = useState<CatArt | null>(null);
  useEffect(() => {
    let alive = true;
    import("./catArt").then((m) => alive && setArt({ WALKER: m.WALKER, SITTER: m.SITTER }));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- Measure ---------- */

  const [layout, setLayout] = useState<Layout | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  const measure = useCallback(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const seat = seatRef.current;
    const base = baselineRef.current;
    if (!section || !text || !seat || !base) return;
    const s = section.getBoundingClientRect();
    const t = text.getBoundingClientRect();
    const fontSize = Number.parseFloat(getComputedStyle(text).fontSize) || t.height;
    setLayout({
      width: s.width,
      height: s.height,
      baseline: base.getBoundingClientRect().top - s.top,
      textLeft: t.left - s.left,
      textRight: t.right - s.left,
      seatLeft: seat.getBoundingClientRect().left - s.left,
      cap: fontSize * CAP_RATIO,
      letters: letterRefs.current.filter(Boolean).map((el) => {
        const r = el!.getBoundingClientRect();
        return { left: r.left - s.left, width: r.width };
      }),
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const done = () => alive && setFontsReady(true);
    if (document.fonts?.ready) document.fonts.ready.then(done);
    else done();
    return () => {
      alive = false;
    };
  }, []);

  useIsoLayoutEffect(() => {
    measure();
    const section = sectionRef.current;
    if (!section) return;
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, [measure, fontsReady, name, uppercase, fontFamily]);

  /* ---------- Playback ---------- */

  const [phase, setPhase] = useState<Phase>("waiting");
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const walkTime = Math.max(1.5, duration);
  const total = walkTime + SIT.total;
  const ready = layout !== null && fontsReady && art !== null;
  const status: Status = phase !== "waiting" ? phase : ready ? "idle" : "preparing";

  const play = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (status !== "idle" || reduced) return;
    if (trigger === "mount") {
      const raf = requestAnimationFrame(play);
      return () => cancelAnimationFrame(raf);
    }
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          play();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [status, trigger, reduced, play]);

  // The clock. Clamped deltas stop a backgrounded tab from skipping the walk.
  useEffect(() => {
    if (status !== "playing") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      tRef.current += Math.min(0.05, (now - last) / 1000);
      last = now;
      setT(tRef.current);
      if (tRef.current >= total) {
        setPhase("done");
        onCompleteRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, total]);

  useEffect(() => {
    if (status !== "done" || !loop || reduced) return;
    const id = window.setTimeout(play, loopDelay * 1000);
    return () => window.clearTimeout(id);
  }, [status, loop, loopDelay, reduced, play]);

  /* ---------- Frame ---------- */

  const L = layout;
  const finished = reduced || status === "done";
  const time = finished ? total : t;

  // One scale for both poses, from the letters' cap height.
  const scale = L ? (L.cap * CAT_TO_CAP) / SITTER_EXTENT.height : 0;
  // Front-paw x where the cat sits: its tail tucks in just after the name.
  const seatX = L ? L.seatLeft - SITTER_EXTENT.back * scale : 0;
  const startX = -(WALKER_EXTENT.front * scale) - 12;

  const walkU = clamp(time / walkTime);
  const catX = lerp(startX, seatX, easeWalk(walkU));
  const sitT = time - walkTime;
  const gaitAmount = 1 - easeInOut(progress(time, walkTime - SIT.settle * 0.6, SIT.settle));
  const tilt = -8 * easeInOut(progress(sitT, SIT.tiltStart, SIT.tilt));
  const fade = easeInOut(progress(sitT, SIT.fadeStart, SIT.fade));
  const sitterPop = 0.95 + 0.05 * easeOutBack(progress(sitT, SIT.fadeStart, SIT.fade + 0.15));
  const gaitPhase = scale ? (catX - startX) / scale / STRIDE_DISTANCE : 0;

  const textWidth = L ? L.textRight - L.textLeft : 0;
  const feather = Math.max(40, textWidth * 0.12);
  const trailingEdge = catX + REVEAL_TRAIL * scale;
  const boost = easeOutCubic(progress(sitT, 0, SIT.reveal));
  const reveal = finished
    ? Number.POSITIVE_INFINITY
    : L
      ? lerp(trailingEdge, Math.max(trailingEdge, L.textRight + feather), boost)
      : Number.NEGATIVE_INFINITY;
  const revealLocal = L ? reveal - L.textLeft : 0;
  const maskImage = finished
    ? "none"
    : `linear-gradient(90deg, #000 ${(revealLocal - feather).toFixed(1)}px, transparent ${revealLocal.toFixed(1)}px)`;

  const copyVisible = finished || sitT >= SIT.fadeStart + SIT.fade;
  const showWalker = !reduced && status === "playing" && fade < 1;
  const showSitter = reduced || status === "done" || (status === "playing" && fade > 0);
  const shadowColor = `color-mix(in srgb, ${palette.line} 14%, transparent)`;

  const HeadingTag = headingLevel;
  const hasActions = Boolean(primaryAction || secondaryAction);
  const style = {
    "--crh-brand": colors.brand,
    "--crh-bg": colors.background,
    "--crh-text": colors.text,
    "--crh-on-brand": colors.onBrand,
    minHeight,
  } as CSSProperties;

  const fadeCls = (visible: boolean, delay = "") =>
    `transition-[opacity,translate] duration-700 ${delay} ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`;

  // Font size that fits the name plus the seat into the container.
  const fontSize = `min(13rem, calc(92cqi / ${(Math.max(chars.length, 4) * 0.42 + SEAT_EM).toFixed(3)}))`;

  return (
    <section
      ref={sectionRef}
      style={style}
      data-status={status}
      aria-busy={status === "preparing" || status === "playing"}
      className={`crh relative isolate flex w-full flex-col items-center justify-center overflow-hidden bg-[var(--crh-bg)] px-4 py-16 [container-type:inline-size] sm:px-8 sm:py-20 ${className}`}
    >
      {eyebrow && (
        <p
          data-crh-copy
          className={`mb-4 rounded-full border border-[color-mix(in_srgb,var(--crh-brand)_25%,transparent)] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[var(--crh-brand)] uppercase @xl:mb-6 @xl:text-sm ${fadeCls(copyVisible)}`}
        >
          {eyebrow}
        </p>
      )}

      <HeadingTag className="relative m-0 flex max-w-full items-baseline justify-center leading-none font-normal" style={{ fontFamily, fontSize }}>
        <span className="sr-only">{name}</span>
        <span
          ref={textRef}
          aria-hidden="true"
          data-crh-text
          className="inline-block whitespace-nowrap text-[var(--crh-brand)]"
          style={{
            letterSpacing: "0.06em",
            marginRight: "-0.06em",
            maskImage,
            WebkitMaskImage: maskImage,
          }}
        >
          {chars.map((ch, i) => {
            const box = L?.letters[i];
            const p = finished ? 1 : box ? easeOutCubic(clamp((reveal - box.left) / (box.width + feather))) : 0;
            return (
              <span
                key={i}
                ref={(el) => {
                  letterRefs.current[i] = el;
                }}
                className="inline-block"
                style={{
                  transform: p >= 1 ? undefined : `translateY(${((1 - p) * 0.12).toFixed(3)}em)`,
                  opacity: 0.25 + 0.75 * p,
                }}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
          <span ref={baselineRef} className="inline-block h-0 w-0 align-baseline" />
        </span>
        {/* Space reserved for the sitting cat */}
        <span ref={seatRef} aria-hidden="true" className="inline-block shrink-0" style={{ width: `${SEAT_EM}em`, marginLeft: "0.06em" }} />
      </HeadingTag>

      {tagline && (
        <p
          data-crh-copy
          className={`mt-5 max-w-2xl text-center text-base leading-relaxed text-balance text-[var(--crh-text)] @xl:mt-7 @xl:text-lg @3xl:text-xl ${fadeCls(copyVisible, "delay-100")}`}
        >
          {tagline}
        </p>
      )}

      {hasActions && (
        <div
          data-crh-copy
          aria-hidden={!copyVisible || undefined}
          className={`mt-8 flex w-full max-w-sm flex-col gap-3 @xl:w-auto @xl:max-w-none @xl:flex-row @xl:justify-center ${fadeCls(copyVisible, "delay-200")} ${copyVisible ? "" : "pointer-events-none"}`}
        >
          {primaryAction && (
            <a
              href={primaryAction.href}
              aria-label={primaryAction.ariaLabel}
              onClick={primaryAction.onClick}
              tabIndex={copyVisible ? undefined : -1}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--crh-brand)] px-6 py-3 text-sm font-semibold text-[var(--crh-on-brand)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--crh-brand)] active:translate-y-0 active:brightness-95 @xl:text-base"
            >
              {primaryAction.label}
            </a>
          )}
          {secondaryAction && (
            <a
              href={secondaryAction.href}
              aria-label={secondaryAction.ariaLabel}
              onClick={secondaryAction.onClick}
              tabIndex={copyVisible ? undefined : -1}
              className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[var(--crh-brand)] px-6 py-3 text-sm font-semibold text-[var(--crh-brand)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--crh-brand)_8%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--crh-brand)] active:translate-y-0 active:bg-[color-mix(in_srgb,var(--crh-brand)_14%,transparent)] @xl:text-base"
            >
              {secondaryAction.label}
            </a>
          )}
        </div>
      )}

      {/* The cat lives on an overlay drawn in section pixels */}
      {L && art && (
        <svg
          aria-hidden="true"
          focusable="false"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${L.width} ${L.height}`}
          preserveAspectRatio="none"
        >
          <g transform={`translate(${catX.toFixed(2)} ${L.baseline.toFixed(2)}) scale(${scale.toFixed(4)})`}>
            {/* soft ground shadow */}
            <ellipse
              cx={lerp(-80, -70, fade)}
              cy={2}
              rx={lerp(115, 95, fade)}
              ry={9}
              fill={shadowColor}
              opacity={showWalker || showSitter ? 1 : 0}
            />
            {showWalker && (
              <g opacity={1 - fade} transform={`rotate(${tilt.toFixed(2)})`}>
                <g transform={`scale(-1 1) translate(${-WALKER_ORIGIN.x} ${-WALKER_ORIGIN.y})`}>
                  <Walker art={art} palette={palette} phase={gaitPhase} amount={gaitAmount} time={time} uid={`crh${uid}`} />
                </g>
              </g>
            )}
            {showSitter && (
              <g opacity={finished ? 1 : fade} transform={`scale(${finished ? 1 : sitterPop.toFixed(4)})`}>
                <g transform={`scale(-1 1) translate(${-SITTER_ORIGIN.x} ${-SITTER_ORIGIN.y})`}>
                  <Sitter art={art} palette={palette} animateTail={!reduced} />
                </g>
              </g>
            )}
          </g>
        </svg>
      )}

      {status === "preparing" && (
        <div aria-hidden className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
          <div className="h-3 w-1/3 max-w-xs animate-pulse rounded-full bg-[color-mix(in_srgb,var(--crh-brand)_18%,transparent)]" />
        </div>
      )}

      {showReplay && !reduced && (
        <button
          type="button"
          onClick={play}
          disabled={status !== "done"}
          aria-label="Replay animation"
          title="Replay animation"
          className="absolute right-3 bottom-3 inline-flex size-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--crh-brand)_30%,transparent)] bg-[var(--crh-bg)] text-[var(--crh-brand)] shadow-sm transition hover:-rotate-45 hover:bg-[color-mix(in_srgb,var(--crh-brand)_8%,var(--crh-bg))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--crh-brand)] active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:rotate-0 @xl:right-5 @xl:bottom-5"
        >
          {status === "playing" || status === "preparing" ? (
            <svg viewBox="0 0 24 24" className="size-5 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          )}
        </button>
      )}

      <style>{`
        @keyframes crh-tail { 0%,100% { transform: rotate(0deg) } 50% { transform: rotate(-7deg) } }
        .crh .crh-tail { transform-box: fill-box; transform-origin: 8% 96%; animation: crh-tail 2.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .crh .crh-tail { animation: none } }
      `}</style>

      {/* Without JavaScript, show the finished name and copy */}
      <noscript>
        <style>{`.crh [data-crh-text]{-webkit-mask-image:none!important;mask-image:none!important}.crh [data-crh-text] span{opacity:1!important;transform:none!important}.crh [data-crh-copy]{opacity:1!important;transform:none!important;translate:none!important}`}</style>
      </noscript>
    </section>
  );
}

export default CatRevealHero;
