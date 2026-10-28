"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ElevatorFloor = {
  /** id of the section element this floor scrolls to. */
  id: string;
  /** Full name, e.g. "Pricing". */
  label: string;
  /** Text on the round button (defaults to the floor number; use "G" or "L" for a lobby). */
  button?: string;
};

export type ElevatorPalette = {
  /** Panel background. */
  panel: string;
  /** Buttons, dial and trim. */
  brass: string;
  /** Lit lamps and the current floor. */
  lamp: string;
  /** Labels. */
  text: string;
};

export type ElevatorNavbarProps = {
  floors: ElevatorFloor[];
  /** Text on the brass name plate. */
  brand?: string;
  /** Scrolling element that holds the sections. Defaults to the window. */
  scrollRoot?: () => HTMLElement | null;
  /** Height (px) of anything pinned above the sections — usually the navbar itself. */
  offset?: number;
  /** Close and open elevator doors over the page while travelling. */
  doors?: boolean;
  /** Start with the arrival "ding" on (users can toggle it). */
  defaultSound?: boolean;
  /** Called after arriving at a floor. */
  onNavigate?: (floor: ElevatorFloor) => void;
  palette?: Partial<ElevatorPalette>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: ElevatorPalette = {
  panel: "#24103f",
  brass: "#d9b26f",
  lamp: "#ffb347",
  text: "#f3e6ff",
};

const DIAL_START = 200; // degrees (SVG angles, clockwise from +x)
const DIAL_SWEEP = 140;
const DOOR_CLOSE_MS = 280;
const DOOR_OPEN_MS = 420;

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

let audio: AudioContext | null = null;
/** A two-note elevator chime made with the Web Audio API. */
function ding() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  audio ??= new Ctx();
  const ctx = audio;
  void ctx.resume();
  const t = ctx.currentTime;
  [
    [1318.5, 0],
    [1046.5, 0.32],
  ].forEach(([freq, delay]) => {
    for (const [mult, vol] of [
      [1, 0.16],
      [2.76, 0.035],
      [5.4, 0.012],
    ]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(vol, t + delay + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 1.6);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + delay);
      osc.stop(t + delay + 1.7);
    }
  });
}

const angleFor = (index: number, count: number) => DIAL_START + (count > 1 ? (DIAL_SWEEP * index) / (count - 1) : DIAL_SWEEP / 2);
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: 60 + r * Math.cos(a), y: 62 + r * Math.sin(a) };
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ElevatorNavbar({
  floors,
  brand = "LOFISTACK",
  scrollRoot,
  offset = 96,
  doors = true,
  defaultSound = false,
  onNavigate,
  palette: paletteOverrides,
  className = "",
}: ElevatorNavbarProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduced = usePrefersReducedMotion();
  const count = floors.length;

  const [position, setPosition] = useState(0); // fractional floor index
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [sound, setSound] = useState(defaultSound);
  const [menuOpen, setMenuOpen] = useState(false);
  const [doorState, setDoorState] = useState<{ phase: "closing" | "opening"; rect: { top: number; left: number; width: number; height: number } } | null>(null);
  const [travelling, setTravelling] = useState<number | null>(null);

  const current = Math.min(count - 1, Math.max(0, Math.round(position - 0.49)));
  const shown = travelling ?? current;

  /* ---------- Scroll spy ---------- */

  const rootRef = useRef(scrollRoot);
  useEffect(() => {
    rootRef.current = scrollRoot;
  }, [scrollRoot]);

  const geometry = useCallback(() => {
    const root = rootRef.current?.() ?? null;
    const scrollTop = root ? root.scrollTop : window.scrollY;
    const viewH = root ? root.clientHeight : window.innerHeight;
    const scrollH = root ? root.scrollHeight : document.documentElement.scrollHeight;
    const rootTop = root ? root.getBoundingClientRect().top : 0;
    const tops = floors.map((f) => {
      const el = document.getElementById(f.id);
      return el ? el.getBoundingClientRect().top - rootTop + scrollTop : 0;
    });
    return { root, scrollTop, viewH, scrollH, tops };
  }, [floors]);

  useEffect(() => {
    let raf = 0;
    let lastTop = -1;
    let dirTimer = 0;
    const measure = () => {
      raf = 0;
      const { scrollTop, viewH, scrollH, tops } = geometry();
      const p = scrollTop + offset + 2;
      let frac = 0;
      if (scrollTop + viewH >= scrollH - 2) frac = count - 1;
      else {
        for (let i = 0; i < count; i++) {
          const next = i + 1 < count ? tops[i + 1] : Infinity;
          if (p >= tops[i] && p < next) {
            frac = next === Infinity ? i : i + (p - tops[i]) / Math.max(1, next - tops[i]);
            break;
          }
        }
      }
      setPosition(frac);
      if (lastTop >= 0 && Math.abs(scrollTop - lastTop) > 1) {
        setDirection(scrollTop > lastTop ? "down" : "up");
        window.clearTimeout(dirTimer);
        dirTimer = window.setTimeout(() => setDirection(null), 350);
      }
      lastTop = scrollTop;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const target: HTMLElement | Window = rootRef.current?.() ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(dirTimer);
    };
  }, [geometry, offset, count]);

  /* ---------- Travel ---------- */

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const go = (index: number, e?: MouseEvent) => {
    e?.preventDefault();
    setMenuOpen(false);
    const floor = floors[index];
    const { root, tops } = geometry();
    const top = Math.max(0, tops[index] - offset + 1);
    const scroll = (behavior: ScrollBehavior) => (root ? root.scrollTo({ top, behavior }) : window.scrollTo({ top, behavior }));
    const arrive = () => {
      if (sound) ding();
      onNavigate?.(floor);
      setTravelling(null);
    };

    timers.current.forEach((t) => window.clearTimeout(t));
    setTravelling(index);
    if (!doors || reduced) {
      scroll(reduced ? "auto" : "smooth");
      timers.current = [window.setTimeout(arrive, reduced ? 0 : 450)];
      return;
    }
    const r = root?.getBoundingClientRect();
    const rect = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    setDoorState({ phase: "closing", rect });
    timers.current = [
      window.setTimeout(() => {
        scroll("auto");
        setDoorState({ phase: "opening", rect });
        arrive();
      }, DOOR_CLOSE_MS + 120),
      window.setTimeout(() => setDoorState(null), DOOR_CLOSE_MS + 120 + DOOR_OPEN_MS),
    ];
  };

  /* ---------- Mobile panel ---------- */

  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("[aria-current], a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !toggleRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  /* ---------- Pieces ---------- */

  const needle = DIAL_START + (count > 1 ? (DIAL_SWEEP * position) / (count - 1) : DIAL_SWEEP / 2);

  const dial = (size: string) => (
    <svg viewBox="0 0 120 70" className={size} aria-hidden="true">
      <path d="M8 62 A52 52 0 0 1 112 62 Z" fill="color-mix(in srgb, var(--el-panel) 70%, black)" stroke="var(--el-brass)" strokeWidth="3" />
      {floors.map((f, i) => {
        const a = angleFor(i, count);
        const tick1 = polar(a, 46);
        const tick2 = polar(a, 50);
        const num = polar(a, 37);
        const lit = i === shown;
        return (
          <g key={f.id}>
            <line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke="var(--el-brass)" strokeWidth="1.5" />
            <text
              x={num.x}
              y={num.y + 3.5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill={lit ? "var(--el-lamp)" : "color-mix(in srgb, var(--el-text) 55%, transparent)"}
              style={{ filter: lit ? "drop-shadow(0 0 3px var(--el-lamp))" : undefined, transition: "fill .25s" }}
            >
              {f.button ?? i + 1}
            </text>
          </g>
        );
      })}
      <g style={{ transform: `rotate(${needle}deg)`, transformOrigin: "60px 62px", transition: reduced ? "none" : "transform .18s ease-out" }}>
        <line x1="60" y1="62" x2="102" y2="62" stroke="var(--el-lamp)" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <circle cx="60" cy="62" r="5" fill="var(--el-brass)" />
    </svg>
  );

  const lamps = (
    <span className="flex flex-col gap-1" aria-hidden="true">
      {(["up", "down"] as const).map((d) => (
        <svg key={d} viewBox="0 0 12 9" className="h-2.5 w-3.5">
          <path
            d={d === "up" ? "M6 0 L12 9 L0 9 Z" : "M0 0 L12 0 L6 9 Z"}
            fill={direction === d ? "var(--el-lamp)" : "color-mix(in srgb, var(--el-text) 18%, transparent)"}
            style={{ filter: direction === d ? "drop-shadow(0 0 4px var(--el-lamp))" : undefined }}
          />
        </svg>
      ))}
    </span>
  );

  const floorButton = (f: ElevatorFloor, i: number, compact = false) => {
    const isCurrent = i === current && travelling === null;
    const isTarget = travelling === i;
    return (
      <a
        key={f.id}
        href={`#${f.id}`}
        onClick={(e) => go(i, e)}
        aria-current={isCurrent ? "location" : undefined}
        className={`group/fb flex items-center gap-2 rounded-full outline-none ${compact ? "flex-row" : "flex-col"}`}
      >
        <span
          className={`relative flex size-10 items-center justify-center rounded-full text-sm font-bold transition-[box-shadow,transform,color] duration-150 group-hover/fb:-translate-y-px group-focus-visible/fb:ring-2 group-focus-visible/fb:ring-[var(--el-lamp)] group-focus-visible/fb:ring-offset-2 group-focus-visible/fb:ring-offset-[var(--el-panel)] group-active/fb:translate-y-px ${
            isCurrent || isTarget
              ? "text-[#3a2208] shadow-[0_0_0_3px_var(--el-lamp),0_0_18px_var(--el-lamp)]"
              : "text-[#3a2208]/80 shadow-[inset_0_-3px_0_rgba(0,0,0,.25)] group-hover/fb:shadow-[0_0_0_2px_color-mix(in_srgb,var(--el-lamp)_60%,transparent),inset_0_-3px_0_rgba(0,0,0,.25)]"
          }`}
          style={{
            background: isCurrent || isTarget
              ? "radial-gradient(circle at 35% 30%, #fff6dc, var(--el-lamp) 60%, color-mix(in srgb, var(--el-lamp) 70%, black))"
              : "radial-gradient(circle at 35% 30%, #fff3d6, var(--el-brass) 55%, color-mix(in srgb, var(--el-brass) 55%, black))",
          }}
        >
          {f.button ?? i + 1}
        </span>
        <span
          className={`text-[10px] font-semibold tracking-[0.18em] whitespace-nowrap uppercase transition-colors ${
            isCurrent || isTarget ? "text-[var(--el-lamp)]" : "text-[var(--el-text)]/70 group-hover/fb:text-[var(--el-text)]"
          }`}
        >
          {f.label}
        </span>
      </a>
    );
  };

  const soundToggle = (
    <button
      type="button"
      onClick={() => setSound((s) => !s)}
      aria-pressed={sound}
      aria-label={sound ? "Turn arrival chime off" : "Turn arrival chime on"}
      title={sound ? "Chime on" : "Chime off"}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--el-text)]/70 ring-1 ring-[var(--el-brass)]/40 transition hover:bg-white/10 hover:text-[var(--el-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--el-lamp)] active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
        {!sound && <path d="M4 4 20 20" />}
      </svg>
    </button>
  );

  const style = {
    "--el-panel": palette.panel,
    "--el-brass": palette.brass,
    "--el-lamp": palette.lamp,
    "--el-text": palette.text,
  } as CSSProperties;

  return (
    <div style={style} className={`el @container sticky top-0 z-40 w-full px-2 pt-2 ${className}`}>
      <nav
        aria-label="Main"
        className="relative flex items-center gap-3 rounded-2xl border border-[var(--el-brass)]/50 px-3 py-2 shadow-[0_10px_30px_-12px_rgba(20,6,40,.6),inset_0_1px_0_rgba(255,255,255,.08)] @3xl:gap-5 @3xl:px-5"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--el-panel) 85%, white), var(--el-panel) 40%, color-mix(in srgb, var(--el-panel) 80%, black))",
        }}
      >
        {/* screws */}
        {["top-1.5 left-1.5", "top-1.5 right-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"].map((p) => (
          <span key={p} aria-hidden="true" className={`absolute ${p} size-1.5 rounded-full bg-[var(--el-brass)]/60`} />
        ))}

        <span className="hidden shrink-0 rounded-md bg-[linear-gradient(180deg,#f3d9a4,var(--el-brass))] px-2.5 py-1 text-[11px] @md:inline-block font-bold tracking-[0.28em] text-[#3b2410] shadow-inner @3xl:text-xs">
          {brand}
        </span>

        {/* Indicator: dial + direction lamps */}
        <div className="flex items-center gap-2">
          {dial("h-10 w-[4.3rem] @3xl:h-14 @3xl:w-24")}
          {lamps}
        </div>
        <p className="sr-only" aria-live="polite">
          {floors[current] ? `Floor ${floors[current].button ?? current + 1}, ${floors[current].label}` : ""}
        </p>

        {/* Desktop buttons */}
        <div className="ml-auto hidden items-end gap-4 @3xl:flex">{floors.map((f, i) => floorButton(f, i))}</div>

        {/* Mobile: current floor + panel toggle */}
        <span className="ml-auto truncate text-xs font-semibold tracking-[0.2em] text-[var(--el-lamp)] uppercase @3xl:hidden">
          {floors[shown]?.label}
        </span>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={`${uid}-panel`}
          aria-label="Choose a floor"
          onClick={() => setMenuOpen((o) => !o)}
          className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-[#3a2208] shadow-[inset_0_-3px_0_rgba(0,0,0,.25)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--el-lamp)] active:translate-y-px @3xl:hidden"
          style={{ background: "radial-gradient(circle at 35% 30%, #fff3d6, var(--el-brass) 55%, color-mix(in srgb, var(--el-brass) 55%, black))" }}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
            <path d={menuOpen ? "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4Z" : "M12 3 18 10H6Z M12 21 6 14h12Z"} />
          </svg>
        </button>

        <div className="hidden @3xl:block">{soundToggle}</div>

        {/* Mobile floor panel */}
        {menuOpen && (
          <div
            ref={menuRef}
            id={`${uid}-panel`}
            className="el-drop absolute top-[calc(100%+8px)] right-2 z-50 w-64 rounded-2xl border border-[var(--el-brass)]/50 p-4 shadow-2xl @3xl:hidden"
            style={{ background: "var(--el-panel)" }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">{floors.map((f, i) => floorButton(f, i, true))}</div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--el-brass)]/25 pt-3 text-[10px] tracking-[0.2em] text-[var(--el-text)]/60 uppercase">
              Chime
              {soundToggle}
            </div>
          </div>
        )}
      </nav>

      {/* Elevator doors over the page while travelling */}
      {doorState && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] flex overflow-hidden"
          style={{ top: doorState.rect.top, left: doorState.rect.left, width: doorState.rect.width, height: doorState.rect.height }}
        >
          {(["left", "right"] as const).map((side) => (
            <span
              key={side}
              className={`relative h-full w-1/2 ${doorState.phase === "closing" ? `el-close-${side}` : `el-open-${side}`}`}
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 2px, transparent 2px 6px), linear-gradient(90deg, #8d8a96, #d8d5de 45%, #a9a6b2 55%, #77747f)",
                boxShadow: side === "left" ? "inset -2px 0 0 rgba(0,0,0,.35)" : "inset 2px 0 0 rgba(255,255,255,.3)",
              }}
            >
              <span
                className="absolute top-1/2 rounded-full bg-[var(--el-brass)] shadow"
                style={{ [side === "left" ? "right" : "left"]: "6%", width: 6, height: "18%", transform: "translateY(-50%)" }}
              />
            </span>
          ))}
          {/* floor number lamp above the doors */}
          <span className="absolute top-6 left-1/2 -translate-x-1/2 rounded-md bg-black/70 px-3 py-1 font-mono text-lg font-bold text-[var(--el-lamp)] [text-shadow:0_0_10px_var(--el-lamp)]">
            {travelling !== null ? (floors[travelling].button ?? travelling + 1) : ""}
          </span>
        </div>
      )}

      <style>{`
        @keyframes el-close-l { from { transform: translateX(-100%) } to { transform: none } }
        @keyframes el-close-r { from { transform: translateX(100%) } to { transform: none } }
        @keyframes el-open-l { from { transform: none } to { transform: translateX(-100%) } }
        @keyframes el-open-r { from { transform: none } to { transform: translateX(100%) } }
        .el .el-close-left { animation: el-close-l ${DOOR_CLOSE_MS}ms cubic-bezier(.5,0,.3,1) both }
        .el .el-close-right { animation: el-close-r ${DOOR_CLOSE_MS}ms cubic-bezier(.5,0,.3,1) both }
        .el .el-open-left { animation: el-open-l ${DOOR_OPEN_MS}ms cubic-bezier(.4,0,.2,1) both }
        .el .el-open-right { animation: el-open-r ${DOOR_OPEN_MS}ms cubic-bezier(.4,0,.2,1) both }
        @keyframes el-drop { from { opacity: 0; transform: translateY(-6px) scale(.98) } to { opacity: 1; transform: none } }
        .el .el-drop { animation: el-drop .16s ease-out both; transform-origin: top right }
        @media (prefers-reduced-motion: reduce) { .el .el-drop { animation: none } }
      `}</style>
    </div>
  );
}

export default ElevatorNavbar;
