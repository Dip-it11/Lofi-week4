"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createProjectorSound, type ProjectorSound } from "./projectorSound";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProjectorImage = {
  src: string;
  /** Describes the image for screen readers (required). */
  alt: string;
  caption?: string;
};

export type ProjectorPalette = {
  /** Film-strip colour. */
  film: string;
  /** Projector light / accents. */
  light: string;
  /** Text on the film edge. */
  edge: string;
};

export type ProjectorLightboxProps = {
  images: ProjectorImage[];
  /** Heading shown in the projection room (and used as the dialog label). */
  title?: string;
  /** Text printed along the film edge. */
  filmStock?: string;
  /** Start with the projector motor sound on (users can toggle it). */
  defaultSound?: boolean;
  /** Called when the lightbox opens (with the frame index) or closes (null). */
  onChange?: (index: number | null) => void;
  palette?: Partial<ProjectorPalette>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: ProjectorPalette = {
  film: "#16110c",
  light: "#ffd89a",
  edge: "#f2a23c",
};

const pad = (n: number) => String(n).padStart(2, "0");

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

/** A small tile of film grain, generated once (only used once the lightbox opens, client-side). */
function makeGrain(): string | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.random() * 60;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Sprocket holes along a strip, as a CSS background. */
const sprockets = (dir: "x" | "y") =>
  dir === "x"
    ? "repeating-linear-gradient(90deg, transparent 0 5px, rgba(240,230,210,.85) 5px 13px, transparent 13px 19px)"
    : "repeating-linear-gradient(180deg, transparent 0 5px, rgba(240,230,210,.85) 5px 13px, transparent 13px 19px)";

/* ------------------------------------------------------------------ */
/* Projector illustration                                              */
/* ------------------------------------------------------------------ */

function Projector({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 160 130" className="h-full w-full" aria-hidden="true">
      {[
        [48, 34],
        [108, 30],
      ].map(([cx, cy], i) => (
        <g key={i} className={spinning ? "pl-reel" : undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r="27" fill="#2a2430" stroke="#8d8799" strokeWidth="3" />
          {[0, 120, 240].map((a) => (
            <circle
              key={a}
              cx={cx + 14 * Math.cos((a * Math.PI) / 180)}
              cy={cy + 14 * Math.sin((a * Math.PI) / 180)}
              r="7"
              fill="#0e0b12"
            />
          ))}
          <circle cx={cx} cy={cy} r="4" fill="#8d8799" />
        </g>
      ))}
      <path d="M48 58 L70 84 M108 54 L96 84" stroke="#3a3342" strokeWidth="2" />
      <rect x="30" y="80" width="104" height="40" rx="8" fill="#3a3342" stroke="#5a5266" strokeWidth="2" />
      <rect x="40" y="88" width="36" height="6" rx="3" fill="#5a5266" />
      <rect x="134" y="88" width="16" height="22" rx="3" fill="#2a2430" stroke="#5a5266" strokeWidth="2" />
      <circle cx="152" cy="99" r="6" fill="var(--pl-light)" className="pl-flicker" />
      <rect x="44" y="120" width="10" height="8" fill="#2a2430" />
      <rect x="112" y="120" width="10" height="8" fill="#2a2430" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ProjectorLightbox({
  images,
  title = "Screening room",
  filmStock = "LOFI 400",
  defaultSound = false,
  onChange,
  palette: paletteOverrides,
  className = "",
}: ProjectorLightboxProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduced = usePrefersReducedMotion();
  const [grain] = useState(makeGrain);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [advance, setAdvance] = useState<{ n: number; dir: 1 | -1 }>({ n: 0, dir: 1 });
  const [sound, setSound] = useState(defaultSound);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const open = index !== null;
  const count = images.length;
  const stripRef = useRef<HTMLDivElement>(null);

  /* Keep the current thumbnail visible in the bottom film strip. */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || index === null) return;
    const thumb = strip.children[index] as HTMLElement | undefined;
    if (!thumb) return;
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  }, [index, reduced]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /* ---------- Sound ---------- */

  const soundRef = useRef<ProjectorSound | null>(null);
  useEffect(() => {
    if (open && sound && !closing) {
      soundRef.current ??= createProjectorSound();
      soundRef.current?.start();
    } else {
      soundRef.current?.stop();
    }
  }, [open, sound, closing]);
  useEffect(() => () => soundRef.current?.dispose(), []);

  /* ---------- Open / close ---------- */

  const show = (i: number) => {
    setIndex(i);
    setClosing(false);
    setAdvance({ n: 0, dir: 1 });
    onChangeRef.current?.(i);
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const lastIndex = useRef(0);
  useEffect(() => {
    if (index !== null) lastIndex.current = index;
  }, [index]);

  const close = useCallback(() => {
    if (closing) return;
    const finish = () => {
      dialogRef.current?.close();
      setIndex(null);
      setClosing(false);
      onChangeRef.current?.(null);
      triggerRefs.current[lastIndex.current]?.focus();
    };
    if (reduced) return finish();
    setClosing(true);
    window.setTimeout(finish, 320);
  }, [closing, reduced]);

  const go = useCallback(
    (next: number) => {
      if (index === null || next < 0 || next >= count || next === index) return;
      setAdvance((a) => ({ n: a.n + 1, dir: next > index ? 1 : -1 }));
      setIndex(next);
      onChangeRef.current?.(next);
      if (sound) soundRef.current?.clack();
    },
    [index, count, sound],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (index === null) return;
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 };
    if (e.key in map) {
      e.preventDefault();
      go(map[e.key]);
    }
  };

  /* ---------- Swipe ---------- */

  const swipeX = useRef<number | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    swipeX.current = e.clientX;
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    if (swipeX.current === null || index === null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };

  /* ---------- Beam geometry (projector lens → screen) ---------- */

  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [beam, setBeam] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const st = stageRef.current?.getBoundingClientRect();
      const ln = lensRef.current?.getBoundingClientRect();
      const sc = screenRef.current?.getBoundingClientRect();
      if (!st || !ln || !sc || !ln.width) return setBeam(null);
      const px = (x: number) => `${(((x - st.left) / st.width) * 100).toFixed(2)}%`;
      const py = (y: number) => `${(((y - st.top) / st.height) * 100).toFixed(2)}%`;
      const lx = ln.left + ln.width * 0.95;
      const ly = ln.top + ln.height * 0.76;
      setBeam(`polygon(${px(lx)} ${py(ly - 4)}, ${px(sc.left)} ${py(sc.top)}, ${px(sc.left)} ${py(sc.bottom)}, ${px(lx)} ${py(ly + 4)})`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (stageRef.current) ro.observe(stageRef.current);
    if (screenRef.current) ro.observe(screenRef.current);
    return () => ro.disconnect();
  }, [open, index, loaded]);

  /* ---------- Render ---------- */

  const style = {
    "--pl-film": palette.film,
    "--pl-light": palette.light,
    "--pl-edge": palette.edge,
  } as CSSProperties;

  const current = index !== null ? images[index] : null;
  const advanceClass = reduced || advance.n === 0 ? "" : advance.dir > 0 ? "pl-next" : "pl-prev";

  return (
    <section style={style} className={`pl @container w-full ${className}`}>
      {/* ---------- Film-strip gallery ---------- */}
      {count === 0 && (
        <p
          className="rounded-md border-2 border-dashed px-6 py-10 text-center font-mono text-xs tracking-[0.25em] uppercase"
          style={{ borderColor: palette.film, color: palette.film }}
        >
          No film loaded — add some images
        </p>
      )}
      <ul role="list" className="grid grid-cols-1 gap-5 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.src + i}>
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              aria-haspopup="dialog"
              aria-label={`Project frame ${i + 1}: ${img.alt}`}
              className="group/f relative block w-full rounded-md bg-[var(--pl-film)] px-[5%] py-[11%] text-left shadow-[0_8px_20px_-10px_rgba(20,10,0,.6)] transition duration-300 outline-none hover:-translate-y-1 hover:-rotate-1 hover:shadow-[0_18px_30px_-12px_rgba(20,10,0,.6),0_0_0_1px_color-mix(in_srgb,var(--pl-light)_40%,transparent)] focus-visible:ring-4 focus-visible:ring-[var(--pl-edge)]/70 active:translate-y-0 active:rotate-0 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              {/* sprocket strips */}
              <span aria-hidden="true" className="absolute inset-x-[4%] top-[3.5%] h-[4%] rounded-[1px]" style={{ background: sprockets("x") }} />
              <span aria-hidden="true" className="absolute inset-x-[4%] bottom-[3.5%] h-[4%] rounded-[1px]" style={{ background: sprockets("x") }} />
              <span className="relative block aspect-[4/3] overflow-hidden rounded-[2px] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover/f:scale-105 group-hover/f:brightness-110 motion-reduce:transition-none" />
                <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,.45))]" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/f:opacity-100 group-focus-visible/f:opacity-100"
                >
                  <span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold tracking-[0.2em] text-[var(--pl-light)] uppercase backdrop-blur-sm">▶ Project</span>
                </span>
              </span>
              <span aria-hidden="true" className="absolute bottom-[0.5%] left-[6%] font-mono text-[9px] tracking-[0.2em] text-[var(--pl-edge)]/80">
                ▸ {pad(i + 1)}A
              </span>
              <span aria-hidden="true" className="absolute top-[0.5%] right-[6%] font-mono text-[9px] tracking-[0.2em] text-[var(--pl-edge)]/70">
                {filmStock}
              </span>
            </button>
            {img.caption && <p className="mt-2 px-1 text-sm text-[#5d5275]">{img.caption}</p>}
          </li>
        ))}
      </ul>

      {/* ---------- Projection room ---------- */}
      <dialog
        ref={dialogRef}
        aria-labelledby={`${uid}-title`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onKeyDown={onKeyDown}
        className="pl-dialog fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-white backdrop:bg-[#06030b]/90"
      >
        {current && index !== null && (
          <div
            className={`@container flex h-full flex-col bg-[radial-gradient(ellipse_at_60%_45%,#2a1d3a_0%,#120a1c_55%,#07040c_100%)] ${closing ? "pl-room-out" : "pl-room-in"}`}
            style={style}
          >
            {/* top bar */}
            <div className="flex items-center gap-3 px-4 pt-4 @xl:px-6">
              <h2 id={`${uid}-title`} className="min-w-0 truncate text-xs font-semibold tracking-[0.2em] text-white/80 uppercase @xl:text-sm @xl:tracking-[0.25em]">
                {title}
              </h2>
              <span className="shrink-0 font-mono text-xs whitespace-nowrap text-[var(--pl-light)]/80" aria-live="polite">
                Frame {pad(index + 1)} / {pad(count)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSound((s) => !s)}
                  aria-pressed={sound}
                  aria-label={sound ? "Turn projector sound off" : "Turn projector sound on"}
                  className="inline-flex size-10 items-center justify-center rounded-full text-white/75 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pl-light)] active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                    {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6m0-6-5 6" />}
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close projector"
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pl-light)] active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* stage */}
            <div
              ref={stageRef}
              className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-3 py-4 @xl:px-16"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
            >
              {/* projector + beam (wide screens) */}
              <div ref={lensRef} className="pointer-events-none absolute bottom-[6%] left-[1.5%] hidden w-36 @5xl:block" aria-hidden="true">
                <Projector spinning={!reduced && !closing} />
              </div>
              {beam && (
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 hidden mix-blend-screen @5xl:block ${reduced ? "" : "pl-beam"}`}
                  style={{
                    clipPath: beam,
                    background: "linear-gradient(90deg, color-mix(in srgb, var(--pl-light) 55%, transparent), color-mix(in srgb, var(--pl-light) 8%, transparent) 70%)",
                    opacity: closing ? 0 : undefined,
                    transition: "opacity .25s",
                  }}
                />
              )}

              {/* the screen */}
              <div className="relative flex max-h-full max-w-full items-stretch gap-0 rounded-sm bg-[var(--pl-film)] p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,.9)] @xl:p-2">
                <span aria-hidden="true" className="w-3 shrink-0 @xl:w-4" style={{ background: sprockets("y"), backgroundSize: "60% 100%", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
                <div
                  ref={screenRef}
                  key={advance.n}
                  style={{ width: "min(80vw, 1000px, calc((100dvh - 15rem) * 4 / 3))", aspectRatio: "4 / 3" }}
                  className={`relative overflow-hidden bg-black ${advanceClass} ${closing ? "pl-screen-out" : advance.n === 0 && !reduced ? "pl-warm" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.src}
                    alt={current.alt}
                    onLoad={() => setLoaded((l) => ({ ...l, [index]: true }))}
                    className={`block h-full w-full object-contain select-none ${reduced ? "" : "pl-flicker-img"}`}
                    draggable={false}
                  />
                  {!loaded[index] && (
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-xs tracking-[0.3em] text-white/60 uppercase">Threading film…</span>
                  )}
                  {/* grain + vignette + scratch */}
                  <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${reduced ? "" : "pl-grain"}`} style={{ backgroundImage: grain ? `url(${grain})` : undefined, opacity: 0.55 }} />
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,.55))]" />
                  {!reduced && <span aria-hidden="true" className="pl-scratch pointer-events-none absolute top-0 bottom-0 w-px bg-white/25" />}
                </div>
                <span aria-hidden="true" className="w-3 shrink-0 @xl:w-4" style={{ background: sprockets("y"), backgroundSize: "60% 100%", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
              </div>

              {/* prev / next */}
              {(["prev", "next"] as const).map((d) => {
                const target = d === "prev" ? index - 1 : index + 1;
                const disabled = target < 0 || target >= count;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => go(target)}
                    disabled={disabled}
                    aria-label={d === "prev" ? "Previous frame" : "Next frame"}
                    className={`absolute top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/75 hover:ring-[var(--pl-light)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pl-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-black/55 ${
                      d === "prev" ? "left-2 @xl:left-4" : "right-2 @xl:right-4"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={d === "prev" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* caption + film-strip navigator */}
            <div className="px-4 pb-4 @xl:px-6">
              <p className="mb-3 min-h-5 text-center text-sm text-white/80">{current.caption ?? current.alt}</p>
              <div ref={stripRef} className="relative mx-auto flex max-w-full gap-1.5 overflow-x-auto rounded-sm bg-[var(--pl-film)] px-2 py-3 [scrollbar-width:thin] @xl:w-fit" style={{ backgroundImage: `${sprockets("x")}, ${sprockets("x")}`, backgroundSize: "100% 5px, 100% 5px", backgroundPosition: "0 3px, 0 calc(100% - 3px)", backgroundRepeat: "no-repeat" }}>
                {images.map((img, i) => (
                  <button
                    key={img.src + i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Frame ${i + 1}: ${img.alt}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`relative h-10 w-14 shrink-0 overflow-hidden rounded-[2px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pl-light)] ${
                      i === index ? "ring-2 ring-[var(--pl-light)]" : "opacity-50 hover:opacity-90"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-white/45">← → to advance · swipe on touch · Esc to close</p>
            </div>
          </div>
        )}
      </dialog>

      <style>{`
        .pl .pl-dialog::backdrop { background: rgba(6,3,11,.9); }
        @keyframes pl-spin { to { transform: rotate(360deg) } }
        .pl .pl-reel { animation: pl-spin 1.6s linear infinite; }
        @keyframes pl-flicker { 0%,100% { opacity: 1 } 45% { opacity: .82 } 50% { opacity: .95 } 72% { opacity: .88 } }
        .pl .pl-flicker, .pl .pl-beam { animation: pl-flicker .22s steps(3) infinite; }
        @keyframes pl-flicker-img { 0%,100% { filter: brightness(1) } 33% { filter: brightness(.94) } 66% { filter: brightness(1.04) } }
        .pl .pl-flicker-img { animation: pl-flicker-img .18s steps(2) infinite; }
        @keyframes pl-grain { 0% { background-position: 0 0 } 20% { background-position: -30px 12px } 40% { background-position: 18px -26px } 60% { background-position: -12px 30px } 80% { background-position: 26px 6px } 100% { background-position: 0 0 } }
        .pl .pl-grain { animation: pl-grain .5s steps(5) infinite; }
        @keyframes pl-scratch { 0% { left: 18% } 30% { left: 62% } 60% { left: 34% } 100% { left: 80% } }
        .pl .pl-scratch { animation: pl-scratch 2.6s steps(9) infinite; }
        @keyframes pl-warm { 0% { opacity: 0; filter: brightness(2) blur(6px) } 30% { opacity: .6 } 40% { opacity: .2 } 60% { opacity: .9 } 70% { opacity: .5 } 100% { opacity: 1; filter: none } }
        .pl .pl-warm { animation: pl-warm .7s ease-out both; }
        @keyframes pl-next { 0% { transform: translateY(14%); filter: blur(4px) brightness(.4) } 100% { transform: none; filter: none } }
        @keyframes pl-prev { 0% { transform: translateY(-14%); filter: blur(4px) brightness(.4) } 100% { transform: none; filter: none } }
        .pl .pl-next { animation: pl-next .26s cubic-bezier(.2,.9,.3,1) both; }
        .pl .pl-prev { animation: pl-prev .26s cubic-bezier(.2,.9,.3,1) both; }
        @keyframes pl-screen-out { to { opacity: 0; transform: scale(.97); filter: brightness(.2) } }
        .pl .pl-screen-out { animation: pl-screen-out .3s ease-in both; }
        @keyframes pl-room-in { from { opacity: 0 } to { opacity: 1 } }
        .pl .pl-room-in { animation: pl-room-in .25s ease-out both; }
        @keyframes pl-room-out { to { opacity: 0 } }
        .pl .pl-room-out { animation: pl-room-out .3s ease-in both; }
        @media (prefers-reduced-motion: reduce) {
          .pl .pl-reel, .pl .pl-flicker, .pl .pl-beam, .pl .pl-flicker-img, .pl .pl-grain, .pl .pl-scratch, .pl .pl-warm, .pl .pl-room-in, .pl .pl-room-out { animation: none }
        }
      `}</style>
    </section>
  );
}

export default ProjectorLightbox;
