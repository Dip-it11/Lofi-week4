"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPrinterSound, type PrinterSound } from "./printerSound";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ReceiptType = "success" | "error" | "warning" | "info";

export type ReceiptLine = { label: string; value: string };

export type ReceiptOptions = {
  /** Reuse an id to avoid printing the same receipt twice. */
  id?: string;
  type?: ReceiptType;
  title: string;
  message?: string;
  /** Line items printed with dotted leaders, e.g. { label: "Total", value: "$24.00" }. */
  items?: ReceiptLine[];
  /** Milliseconds before it tears itself off. 0 keeps it until the user tears it. */
  duration?: number;
  /** One button on the receipt (e.g. "Undo", "Retry"). Pressing it also tears the receipt. */
  action?: { label: string; onClick: () => void };
};

export type ReceiptPrinterApi = {
  /** Queue a receipt. Returns its id. */
  print: (options: ReceiptOptions) => string;
  success: (title: string, options?: Omit<ReceiptOptions, "title" | "type">) => string;
  error: (title: string, options?: Omit<ReceiptOptions, "title" | "type">) => string;
  warning: (title: string, options?: Omit<ReceiptOptions, "title" | "type">) => string;
  info: (title: string, options?: Omit<ReceiptOptions, "title" | "type">) => string;
  /** Tear one receipt off (or cancel it if it's still queued). */
  tear: (id: string) => void;
  /** Tear everything off and empty the queue. */
  clear: () => void;
};

export type ReceiptPalette = {
  /** Printer body. */
  body: string;
  /** Receipt paper. */
  paper: string;
  /** Printed text. */
  ink: string;
  /** Status lamp / highlights. */
  accent: string;
};

export type ReceiptPrinterProps = {
  children?: ReactNode;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Position inside the nearest positioned parent instead of the window (for previews and panels). */
  contained?: boolean;
  /** Keep the printer visible when there's nothing to print. */
  alwaysShow?: boolean;
  /** Most receipts on screen at once — older ones tear off automatically. */
  max?: number;
  /** Default auto-tear time in ms (errors get at least 8 s). */
  duration?: number;
  /** Name printed on the printer and on every receipt. */
  brand?: string;
  /** Start with printer sounds on (users can toggle them on the printer). */
  defaultSound?: boolean;
  palette?: Partial<ReceiptPalette>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

type Phase = "queued" | "printing" | "shown" | "tearing";

type Entry = Required<Pick<ReceiptOptions, "id" | "type" | "title">> &
  Omit<ReceiptOptions, "id" | "type" | "title"> & { no: number; at: number; phase: Phase; dir: 1 | -1 };

type State = { queue: Entry[]; items: Entry[] };

type Action =
  | { t: "add"; entry: Entry }
  | { t: "printed"; id: string }
  | { t: "tear"; id: string; dir?: 1 | -1 }
  | { t: "remove"; id: string }
  | { t: "clear" };

/** Start the next queued receipt when the printer is free, and tear off the oldest past `max`. */
function advance(s: State, max: number): State {
  let { queue, items } = s;
  if (!items.some((e) => e.phase === "printing") && queue.length) {
    items = [...items, { ...queue[0], phase: "printing" }];
    queue = queue.slice(1);
  }
  const live = items.filter((e) => e.phase !== "tearing");
  if (live.length > max) {
    const drop = new Set(live.slice(0, live.length - max).map((e) => e.id));
    items = items.map((e) => (drop.has(e.id) ? { ...e, phase: "tearing" } : e));
  }
  return { queue, items };
}

function reduce(s: State, a: Action, max: number): State {
  switch (a.t) {
    case "add":
      if (s.queue.some((e) => e.id === a.entry.id) || s.items.some((e) => e.id === a.entry.id && e.phase !== "tearing")) return s;
      return advance({ ...s, queue: [...s.queue, a.entry] }, max);
    case "printed":
      return advance({ ...s, items: s.items.map((e) => (e.id === a.id && e.phase === "printing" ? { ...e, phase: "shown" } : e)) }, max);
    case "tear":
      return advance(
        {
          queue: s.queue.filter((e) => e.id !== a.id),
          items: s.items.map((e) => (e.id === a.id && e.phase !== "tearing" ? { ...e, phase: "tearing", dir: a.dir ?? 1 } : e)),
        },
        max,
      );
    case "remove":
      return advance({ ...s, items: s.items.filter((e) => e.id !== a.id) }, max);
    case "clear":
      return { queue: [], items: s.items.map((e) => ({ ...e, phase: "tearing" })) };
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: ReceiptPalette = {
  body: "#351367",
  paper: "#fbf8f1",
  ink: "#2a2236",
  accent: "#ffb347",
};

const TYPES: Record<ReceiptType, { stamp: string; label: string; color: string; icon: string }> = {
  success: { stamp: "DONE", label: "Success", color: "#1f8a4c", icon: "✓" },
  error: { stamp: "VOID", label: "Error", color: "#c8322b", icon: "✕" },
  warning: { stamp: "CHECK", label: "Warning", color: "#b86a00", icon: "!" },
  info: { stamp: "NOTE", label: "Info", color: "#3b5bdb", icon: "i" },
};

const MONO = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace';

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

const PrinterContext = createContext<ReceiptPrinterApi | null>(null);

/** Print receipts from anywhere inside <ReceiptPrinter>. */
export function useReceiptPrinter(): ReceiptPrinterApi {
  const api = useContext(PrinterContext);
  if (!api) throw new Error("useReceiptPrinter must be used inside <ReceiptPrinter>.");
  return api;
}

/* ------------------------------------------------------------------ */
/* One receipt                                                         */
/* ------------------------------------------------------------------ */

type ReceiptProps = {
  entry: Entry;
  brand: string;
  open: boolean;
  paused: boolean;
  reduced: boolean;
  duration: number;
  onPrintStart: (ms: number) => void;
  onPrinted: (id: string, type: ReceiptType) => void;
  onTear: (id: string, dir?: 1 | -1) => void;
  onRemoved: (id: string) => void;
};

function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Receipt({ entry, brand, open, paused, reduced, duration, onPrintStart, onPrinted, onTear, onRemoved }: ReceiptProps) {
  const liRef = useRef<HTMLLIElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; dx: number; pointer: number } | null>(null);
  const t = TYPES[entry.type];
  const { id, phase, dir, type } = entry;

  /* Feed the paper out of the slot, one printed line at a time. */
  useLayoutEffect(() => {
    if (phase !== "printing") return;
    const li = liRef.current;
    if (!li) return;
    if (reduced) {
      const timer = window.setTimeout(() => onPrinted(id, type), 0);
      return () => window.clearTimeout(timer);
    }
    const h = li.scrollHeight;
    const lines = Math.max(6, Math.min(22, Math.round(h / 12)));
    const ms = Math.min(1500, 380 + lines * 48);
    onPrintStart(ms);
    const anim = li.animate([{ height: "0px" }, { height: `${h}px` }], { duration: ms, easing: `steps(${lines}, end)`, fill: "forwards" });
    anim.onfinish = () => onPrinted(id, type);
    return () => anim.cancel();
  }, [phase, id, type, reduced, onPrintStart, onPrinted]);

  /* Tear it off: the paper flies away, then the gap closes. */
  useEffect(() => {
    if (phase !== "tearing") return;
    const li = liRef.current;
    const paper = paperRef.current;
    if (!li || !paper || reduced) {
      const timer = window.setTimeout(() => onRemoved(id), 0);
      return () => window.clearTimeout(timer);
    }
    const h = li.getBoundingClientRect().height;
    li.style.overflow = "visible";
    const from = paper.style.transform || "none";
    paper.style.transition = "none";
    const fly = paper.animate(
      [
        { transform: from, opacity: 1 },
        { transform: `translate(${dir * 110}px, -26px) rotate(${dir * 9}deg)`, opacity: 0 },
      ],
      { duration: 260, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" },
    );
    let close: Animation | undefined;
    fly.onfinish = () => {
      li.style.overflow = "hidden";
      close = li.animate([{ height: `${h}px` }, { height: "0px" }], { duration: 180, easing: "ease-in", fill: "forwards" });
      close.onfinish = () => onRemoved(id);
    };
    return () => {
      fly.cancel();
      close?.cancel();
    };
  }, [phase, id, dir, reduced, onRemoved]);

  /* Swipe sideways to tear. */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "shown" || (e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, dx: 0, pointer: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.transition = "none";
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    d.dx = e.clientX - d.x;
    e.currentTarget.style.transform = `translateX(${d.dx}px) rotate(${d.dx / 40}deg)`;
    e.currentTarget.style.opacity = String(Math.max(0.35, 1 - Math.abs(d.dx) / 260));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (Math.abs(d.dx) > 70) {
      onTear(id, d.dx > 0 ? 1 : -1);
      return;
    }
    const el = e.currentTarget;
    el.style.transition = "transform .25s cubic-bezier(.2,1.4,.4,1), opacity .25s";
    el.style.transform = "";
    el.style.opacity = "";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && phase !== "tearing") {
      e.stopPropagation();
      onTear(id);
    }
  };

  const time = new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const sticky = !duration || !Number.isFinite(duration);
  const running = phase === "shown" && !paused;

  return (
    <li ref={liRef} className={phase === "printing" ? "overflow-hidden" : undefined} style={phase === "printing" ? { height: 0 } : undefined}>
      <div className="rp-shadow pt-1.5">
        <div
          ref={paperRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className="rp-paper relative touch-pan-y bg-[var(--rp-paper)] px-3.5 pt-3.5 pb-3 text-[var(--rp-ink)] select-none"
          style={{ fontFamily: MONO }}
        >
          <Collapsible open={open}>
            <div className="flex items-center justify-between gap-2 text-[10px] tracking-[0.18em] whitespace-nowrap uppercase opacity-70">
              <span className="min-w-0 truncate font-bold">{brand}</span>
              <span className="shrink-0">
                #{String(entry.no).padStart(4, "0")} · {time}
              </span>
            </div>
            <div aria-hidden="true" className="my-2 border-t border-dashed border-[var(--rp-ink)]/35" />
          </Collapsible>

          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-px grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-black text-white"
              style={{ background: t.color }}
            >
              {t.icon}
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-5 font-bold tracking-wide uppercase">
              <span className="sr-only">{t.label}: </span>
              {entry.title}
            </p>
            <button
              type="button"
              onClick={() => onTear(id)}
              aria-label={`Tear off: ${entry.title}`}
              className="-mt-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-full text-[var(--rp-ink)]/60 transition hover:bg-[var(--rp-ink)]/10 hover:text-[var(--rp-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--rp-ink)] active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
              </svg>
            </button>
          </div>

          <Collapsible open={open}>
            <div className="relative">
              {entry.message && <p className="mt-1.5 pr-14 text-[12px] leading-[1.45] opacity-85">{entry.message}</p>}
              {entry.items && entry.items.length > 0 && (
                <dl className="mt-2 space-y-0.5 text-[12px]">
                  {entry.items.map((line, i) => (
                    <div key={i} className="flex items-baseline gap-1.5">
                      <dt className="shrink-0">{line.label}</dt>
                      <span aria-hidden="true" className="min-w-3 flex-1 translate-y-[-3px] border-b border-dotted border-[var(--rp-ink)]/40" />
                      <dd className="shrink-0 font-bold">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {entry.action && (
                <button
                  type="button"
                  onClick={() => {
                    entry.action?.onClick();
                    onTear(id);
                  }}
                  className="mt-2.5 inline-flex h-8 items-center rounded-md border-2 border-[var(--rp-ink)] px-3 text-[11px] font-bold tracking-[0.15em] uppercase transition hover:bg-[var(--rp-ink)] hover:text-[var(--rp-paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rp-ink)] active:scale-95"
                >
                  {entry.action.label}
                </button>
              )}
              <div aria-hidden="true" className="my-2 border-t border-dashed border-[var(--rp-ink)]/35" />
              <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase opacity-60">
                {sticky ? (
                  <span>Keep · tear off when done</span>
                ) : (
                  <>
                    <span className="shrink-0">{paused && phase === "shown" ? "Paused" : "Auto-tear"}</span>
                    <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--rp-ink)]/12">
                      <span
                        className="rp-timer absolute inset-0 origin-left rounded-full bg-[var(--rp-ink)]/55"
                        style={{ animationDuration: `${duration}ms`, animationPlayState: running ? "running" : "paused" }}
                        onAnimationEnd={() => onTear(id)}
                      />
                    </span>
                  </>
                )}
              </div>
              {phase !== "printing" && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute top-0 right-0 rounded-md border-[3px] px-1.5 py-0.5 text-[15px] font-black tracking-[0.12em] mix-blend-multiply ${reduced ? "" : "rp-stamp"}`}
                  style={{ color: t.color, borderColor: t.color, transform: "rotate(-14deg)", opacity: 0.8 }}
                >
                  {t.stamp}
                </span>
              )}
            </div>
          </Collapsible>
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Printer                                                             */
/* ------------------------------------------------------------------ */

let nextNo = 1;

function makeApi(dispatch: (a: Action) => void): ReceiptPrinterApi {
  const print = (o: ReceiptOptions) => {
    const no = nextNo++;
    const id = o.id ?? `receipt-${no}`;
    dispatch({ t: "add", entry: { ...o, id, type: o.type ?? "info", no, at: Date.now(), phase: "queued", dir: 1 } });
    return id;
  };
  const typed = (type: ReceiptType) => (title: string, o?: Omit<ReceiptOptions, "title" | "type">) => print({ ...o, title, type });
  return {
    print,
    success: typed("success"),
    error: typed("error"),
    warning: typed("warning"),
    info: typed("info"),
    tear: (id) => dispatch({ t: "tear", id }),
    clear: () => dispatch({ t: "clear" }),
  };
}

/**
 * Wrap your app (or a panel) in <ReceiptPrinter>, then call useReceiptPrinter().print(...)
 * from any child. Notifications print out of a little thermal printer and tear off.
 */
export function ReceiptPrinter({
  children,
  position = "bottom-right",
  contained = false,
  alwaysShow = false,
  max = 3,
  duration = 5000,
  brand = "LOFISTACK",
  defaultSound = false,
  palette: paletteOverrides,
  className = "",
}: ReceiptPrinterProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const reduced = usePrefersReducedMotion();
  const [state, dispatch] = useReducer((s: State, a: Action) => reduce(s, a, Math.max(1, max)), { queue: [], items: [] });
  const [sound, setSound] = useState(defaultSound);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);

  /* ---------- Sound ---------- */
  const sfx = useRef<PrinterSound | null>(null);
  const play = useCallback(
    (fn: (s: PrinterSound) => void) => {
      if (!sound) return;
      sfx.current ??= createPrinterSound();
      if (sfx.current) fn(sfx.current);
    },
    [sound],
  );
  useEffect(() => () => sfx.current?.dispose(), []);

  /* Pause timers while the tab is hidden. */
  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  /* ---------- API ---------- */
  const api = useMemo(() => makeApi(dispatch), []);

  const onPrintStart = useCallback((ms: number) => play((s) => s.feed(ms)), [play]);
  const onPrinted = useCallback(
    (id: string, type: ReceiptType) => {
      dispatch({ t: "printed", id });
      play((s) => s.beep(type));
    },
    [play],
  );
  const onTear = useCallback(
    (id: string, dir?: 1 | -1) => {
      play((s) => s.tear());
      dispatch({ t: "tear", id, dir });
    },
    [play],
  );
  const sectionRef = useRef<HTMLElement>(null);
  const onRemoved = useCallback((id: string) => {
    dispatch({ t: "remove", id });
    // A focused button that disappears never fires blur — re-check so timers don't stay paused.
    requestAnimationFrame(() => setFocused(!!sectionRef.current?.contains(document.activeElement)));
  }, []);

  /* ---------- Derived ---------- */
  const { queue, items } = state;
  const live = items.filter((e) => e.phase !== "tearing");
  const printing = items.some((e) => e.phase === "printing");
  const newestId = live.at(-1)?.id;
  const expanded = hovered || focused;
  const paused = expanded || hidden;
  const visible = alwaysShow || items.length > 0 || queue.length > 0;
  const latest = live.at(-1);
  const sentence = (e: Entry) => `${e.title}${/[.!?…]$/.test(e.title) ? "" : "."} ${e.message ?? ""}`.trim();
  const politeText = latest && latest.type !== "error" ? `${TYPES[latest.type].label}: ${sentence(latest)}` : "";
  const alertText = latest && latest.type === "error" ? sentence(latest) : "";

  const resolveDuration = (e: Entry) => {
    const d = e.duration ?? duration;
    if (!d) return 0;
    return e.type === "error" ? Math.max(d, 8000) : d;
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  const style = {
    "--rp-body": palette.body,
    "--rp-paper": palette.paper,
    "--rp-ink": palette.ink,
    "--rp-accent": palette.accent,
  } as CSSProperties;

  const place =
    position === "bottom-left" ? "left-3" : position === "bottom-center" ? "left-1/2 -translate-x-1/2" : "right-3";

  return (
    <PrinterContext.Provider value={api}>
      {children}
      <section
        ref={sectionRef}
        aria-label="Notifications"
        style={style}
        className={`rp ${contained ? "absolute" : "fixed"} bottom-0 z-[80] w-[min(21rem,calc(100%-1.5rem))] ${place} ${className}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      >
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {politeText}
        </p>
        <p className="sr-only" aria-live="assertive" aria-atomic="true">
          {alertText}
        </p>

        <div
          className={`transition-transform duration-500 ease-[cubic-bezier(.2,1.2,.4,1)] motion-reduce:transition-none ${
            visible ? "translate-y-0" : "translate-y-[calc(100%+1rem)] delay-700"
          }`}
        >
          {/* paper stack */}
          <ol role="list" className="relative z-0 -mb-2 flex max-h-[min(70vh,34rem)] flex-col justify-end px-[6%]">
            {items.map((e) => (
                <Receipt
                  key={e.id}
                  entry={e}
                  brand={brand}
                  open={expanded || e.id === newestId || e.phase === "printing"}
                  paused={paused}
                  reduced={reduced}
                  duration={resolveDuration(e)}
                  onPrintStart={onPrintStart}
                  onPrinted={onPrinted}
                  onTear={onTear}
                  onRemoved={onRemoved}
                />
              ))}
          </ol>

          {/* the printer */}
          <div className="relative z-10 pb-3">
            <div
              className="relative rounded-t-[10px] rounded-b-[16px] px-3 pt-3.5 pb-2.5 shadow-[0_18px_30px_-14px_rgba(20,6,40,.7)]"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--rp-body) 70%, white) 0, var(--rp-body) 14%, var(--rp-body) 70%, color-mix(in srgb, var(--rp-body) 75%, black))",
              }}
            >
              {/* paper slot */}
              <span aria-hidden="true" className="absolute inset-x-[5%] top-1.5 h-1.5 rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(0,0,0,.8)]" />
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${printing ? "rp-led bg-[var(--rp-accent)]" : "bg-emerald-400"}`}
                  style={{ boxShadow: `0 0 8px ${printing ? palette.accent : "#34d399"}` }}
                />
                <span className="min-w-0 truncate text-[11px] font-bold tracking-[0.28em] text-white/85" style={{ fontFamily: MONO }}>
                  {brand}
                </span>
                <span className="ml-auto shrink-0 text-[10px] tracking-[0.18em] text-white/55 uppercase" style={{ fontFamily: MONO }}>
                  {printing ? "Printing" : "Ready"}
                  {queue.length > 0 && ` · ${queue.length} queued`}
                </span>
                {live.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      play((s) => s.tear());
                      dispatch({ t: "clear" });
                    }}
                    className="h-7 shrink-0 rounded-md bg-white/10 px-2 text-[10px] font-bold tracking-[0.15em] text-white/80 uppercase transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--rp-accent)] active:scale-95"
                  >
                    Tear all
                  </button>
                )}
                <button
                  type="button"
                  aria-pressed={sound}
                  aria-label={sound ? "Turn printer sounds off" : "Turn printer sounds on"}
                  onClick={() => setSound((v) => !v)}
                  className={`grid size-7 shrink-0 place-items-center rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--rp-accent)] active:scale-90 ${
                    sound ? "bg-[var(--rp-accent)] text-[var(--rp-body)]" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 5 6 9H3v6h3l5 4V5z" />
                    {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 6 6M22 9l-6 6" />}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .rp .rp-paper {
          -webkit-mask:
            linear-gradient(#000 0 0) 0 6px / 100% calc(100% - 12px) no-repeat,
            conic-gradient(from 135deg at 50% 0, #000 90deg, #0000 0) 0 0 / 12px 6px repeat-x,
            conic-gradient(from -45deg at 50% 100%, #000 90deg, #0000 0) 0 100% / 12px 6px repeat-x;
          mask:
            linear-gradient(#000 0 0) 0 6px / 100% calc(100% - 12px) no-repeat,
            conic-gradient(from 135deg at 50% 0, #000 90deg, #0000 0) 0 0 / 12px 6px repeat-x,
            conic-gradient(from -45deg at 50% 100%, #000 90deg, #0000 0) 0 100% / 12px 6px repeat-x;
          background-image: linear-gradient(90deg, rgba(0,0,0,.035), transparent 12%, transparent 88%, rgba(0,0,0,.035));
        }
        .rp .rp-shadow { filter: drop-shadow(0 6px 10px rgba(30, 12, 50, .22)); }
        @keyframes rp-timer { from { transform: scaleX(1) } to { transform: scaleX(0) } }
        .rp .rp-timer { animation-name: rp-timer; animation-timing-function: linear; animation-fill-mode: forwards; }
        @keyframes rp-stamp { 0% { transform: rotate(-14deg) scale(2.2); opacity: 0 } 60% { transform: rotate(-14deg) scale(.92); opacity: .9 } 100% { transform: rotate(-14deg) scale(1); opacity: .8 } }
        .rp .rp-stamp { animation: rp-stamp .32s cubic-bezier(.3,1.4,.5,1) both; }
        @keyframes rp-led { 50% { opacity: .35 } }
        .rp .rp-led { animation: rp-led .3s steps(2) infinite; }
        @media (prefers-reduced-motion: reduce) { .rp .rp-led { animation: none } }
      `}</style>
    </PrinterContext.Provider>
  );
}

export default ReceiptPrinter;
