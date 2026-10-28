"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createCabinetSound, type CabinetSound } from "./cabinetSound";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type CabinetFile = {
  /** Stable id (defaults to its position). */
  id?: string;
  question: string;
  answer: ReactNode;
  /** Text on the folder tab, e.g. "Billing". */
  tag?: string;
  /** Extra words the search should match (useful when the answer isn't plain text). */
  keywords?: string;
  /** A locked drawer can't be opened — it rattles instead. */
  locked?: boolean;
};

export type CabinetPalette = {
  /** Cabinet steel. */
  steel: string;
  /** Label frames and handles. */
  brass: string;
  /** Label cards. */
  card: string;
  /** Manila folders. */
  folder: string;
  /** Text. */
  ink: string;
};

export type FilingCabinetFAQProps = {
  items: CabinetFile[];
  /** Text on the brass plate at the top. */
  title?: string;
  /** Let more than one drawer be open at a time. */
  multiple?: boolean;
  /** Ids of drawers that start open. */
  defaultOpen?: string[];
  /** Called with the open drawer ids whenever they change. */
  onOpenChange?: (open: string[]) => void;
  /** Show the "find a file" search. */
  searchable?: boolean;
  /** Start with drawer sounds on (users can toggle them). */
  defaultSound?: boolean;
  palette?: Partial<CabinetPalette>;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: CabinetPalette = {
  steel: "#3d2d5c",
  brass: "#d9b26f",
  card: "#fdf8ee",
  folder: "#ecd39c",
  ink: "#2b2238",
};

const TYPE = 'var(--font-typewriter), "Special Elite", "Courier New", monospace';

const fileId = (f: CabinetFile, i: number) => f.id ?? `file-${i + 1}`;
const fileCode = (i: number) => `${String.fromCharCode(65 + (i % 26))}-${String(i + 1).padStart(2, "0")}`;

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  return "";
}

/** Wrap matches of `q` in a highlighter <mark>. */
function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[2px] bg-[#fff27a] px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* One drawer                                                          */
/* ------------------------------------------------------------------ */

type DrawerProps = {
  file: CabinetFile;
  id: string;
  code: string;
  uid: string;
  open: boolean;
  rattling: boolean;
  query: string;
  onToggle: (id: string) => void;
  onRattleEnd: () => void;
  onNav: (e: KeyboardEvent<HTMLButtonElement>) => void;
};

function Drawer({ file, id, code, uid, open, rattling, query, onToggle, onRattleEnd, onNav }: DrawerProps) {
  const hdr = `${uid}-${id}-hdr`;
  const panel = `${uid}-${id}-panel`;
  const locked = !!file.locked;

  return (
    <div className="flex flex-col">
      {/* The drawer front (comes second in the DOM so the question is read before the answer). */}
      <h3 className="order-2 m-0">
        <button
          id={hdr}
          type="button"
          data-fc-header
          aria-expanded={open}
          aria-controls={panel}
          aria-disabled={locked || undefined}
          onClick={() => onToggle(id)}
          onKeyDown={onNav}
          onAnimationEnd={(e) => e.animationName === "fc-rattle" && onRattleEnd()}
          className={`fc-front group relative z-10 flex w-full items-center gap-3 rounded-md border border-black/35 px-2.5 py-2.5 text-left transition-[filter,transform] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-brass)] @xl:gap-5 @xl:px-4 @xl:py-3.5 ${
            locked ? "cursor-not-allowed" : "hover:brightness-110 active:translate-y-px"
          } ${rattling ? "fc-rattle" : ""} ${open ? "fc-pulled" : ""}`}
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--fc-steel) 72%, white) 0, var(--fc-steel) 9%, var(--fc-steel) 82%, color-mix(in srgb, var(--fc-steel) 70%, black))",
            boxShadow: open
              ? "0 -8px 12px -8px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.18), 0 6px 14px -8px rgba(0,0,0,.6)"
              : "inset 0 1px 0 rgba(255,255,255,.18), inset 0 -2px 0 rgba(0,0,0,.25)",
          }}
        >
          {/* brass label holder */}
          <span
            className="min-w-0 flex-1 rounded-[4px] p-[3px] shadow-[0_1px_2px_rgba(0,0,0,.5)]"
            style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--fc-brass) 60%, white), var(--fc-brass) 45%, color-mix(in srgb, var(--fc-brass) 70%, black))" }}
          >
            <span className={`block rounded-[2px] bg-[var(--fc-card)] px-2.5 py-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,.25)] @xl:px-3.5 @xl:py-2 ${locked ? "opacity-60" : ""}`}>
              <span className="block text-[10px] tracking-[0.2em] text-[#b0342b]" style={{ fontFamily: TYPE }}>
                {code}
                {file.tag && <span className="text-[var(--fc-ink)]/50"> · {file.tag}</span>}
                {locked && <span className="text-[var(--fc-ink)]/60"> · LOCKED</span>}
              </span>
              <span className="block text-[13px] leading-snug text-[var(--fc-ink)] @xl:text-base" style={{ fontFamily: TYPE }}>
                {highlight(file.question, query)}
              </span>
            </span>
          </span>

          {/* pull handle (or lock) */}
          <span aria-hidden="true" className="relative grid h-9 w-11 shrink-0 place-items-center @xl:w-20">
            {locked ? (
              <span
                className="grid size-7 place-items-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.5)]"
                style={{ background: "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--fc-brass) 50%, white), var(--fc-brass) 55%, color-mix(in srgb, var(--fc-brass) 60%, black))" }}
              >
                <span className="h-3 w-1 rounded-full bg-black/70" />
              </span>
            ) : (
              <>
                <span className="absolute top-1/2 left-[12%] h-4 w-1.5 -translate-y-1/2 rounded-sm bg-black/40" />
                <span className="absolute top-1/2 right-[12%] h-4 w-1.5 -translate-y-1/2 rounded-sm bg-black/40" />
                <span
                  className={`h-3 w-full rounded-full shadow-[0_2px_3px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.6)] transition-transform duration-200 group-hover:-translate-y-px ${
                    open ? "translate-y-0.5" : ""
                  }`}
                  style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--fc-brass) 45%, white), var(--fc-brass) 50%, color-mix(in srgb, var(--fc-brass) 65%, black))" }}
                />
              </>
            )}
          </span>
          <span className="sr-only">{locked ? "Locked" : open ? "Close drawer" : "Open drawer"}</span>
        </button>
      </h3>

      {/* The pulled-out drawer: shown above the front, like looking down into it. */}
      <div
        id={panel}
        role="region"
        aria-labelledby={hdr}
        inert={!open}
        className={`order-1 grid transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(.2,.9,.25,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className="mx-[3%] -mb-1 rounded-t-md border-x-[5px] border-t-[5px] px-[3%] pt-5"
            style={{
              borderColor: "color-mix(in srgb, var(--fc-steel) 75%, black)",
              background: "linear-gradient(180deg, #120a1d, color-mix(in srgb, var(--fc-steel) 40%, #120a1d))",
              boxShadow: "inset 0 12px 16px -8px rgba(0,0,0,.8)",
            }}
          >
            {/* back folders peeking up */}
            <div aria-hidden="true" className="relative h-3">
              <span className="absolute bottom-0 left-[40%] h-3 w-16 rounded-t-sm opacity-60" style={{ background: "color-mix(in srgb, var(--fc-folder) 80%, black)" }} />
              <span className="absolute bottom-0 left-[68%] h-3 w-12 rounded-t-sm opacity-45" style={{ background: "color-mix(in srgb, var(--fc-folder) 70%, black)" }} />
            </div>
            {/* front folder with the answer */}
            <div className="relative mt-4 rounded-t-md bg-[var(--fc-folder)] px-4 pt-4 pb-6 text-[var(--fc-ink)] shadow-[0_-2px_6px_rgba(0,0,0,.35)] @xl:px-6 @xl:pt-5 @xl:pb-7">
              <span
                aria-hidden="true"
                className="absolute -top-4 left-3 h-4 rounded-t-md bg-[var(--fc-folder)] px-3 pt-0.5 text-[10px] leading-4 tracking-[0.2em] uppercase @xl:left-5"
                style={{ fontFamily: TYPE }}
              >
                {file.tag ?? code}
              </span>
              <div className="text-sm leading-relaxed @xl:text-[15px] [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_p+p]:mt-2">{file.answer}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cabinet                                                             */
/* ------------------------------------------------------------------ */

/** An FAQ accordion built as a metal filing cabinet: every question is a drawer you pull open. */
export function FilingCabinetFAQ({
  items,
  title = "FAQ · Files",
  multiple = false,
  defaultOpen = [],
  onOpenChange,
  searchable = true,
  defaultSound = false,
  palette: paletteOverrides,
  className = "",
}: FilingCabinetFAQProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const [query, setQuery] = useState("");
  const [rattling, setRattling] = useState<string | null>(null);
  const [sound, setSound] = useState(defaultSound);
  const sfx = useRef<CabinetSound | null>(null);
  useEffect(() => () => sfx.current?.dispose(), []);

  const play = (fn: (s: CabinetSound) => void) => {
    if (!sound) return;
    sfx.current ??= createCabinetSound();
    if (sfx.current) fn(sfx.current);
  };

  const setAndNotify = (next: string[]) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const toggle = (id: string) => {
    const file = items.find((f, i) => fileId(f, i) === id);
    if (file?.locked) {
      setRattling(id);
      play((s) => s.rattle());
      return;
    }
    const isOpen = open.includes(id);
    play((s) => s.slide(!isOpen));
    if (isOpen) setAndNotify(open.filter((x) => x !== id));
    else setAndNotify(multiple ? [...open, id] : [id]);
  };

  const closeAll = () => {
    play((s) => s.slide(false));
    setAndNotify([]);
  };

  /* Arrow keys move between drawers (WAI-ARIA accordion pattern). */
  const onNav = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const list = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>("[data-fc-header]") ?? []);
    const i = list.indexOf(e.currentTarget);
    if (i < 0 || !list.length) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
    list[next].focus();
  };

  const q = query.trim();
  const shown = items
    .map((file, i) => ({ file, i, id: fileId(file, i), code: fileCode(i) }))
    .filter(({ file }) => !q || `${file.question} ${file.keywords ?? ""} ${file.tag ?? ""} ${textOf(file.answer)}`.toLowerCase().includes(q.toLowerCase()));
  const openShown = shown.filter((s) => open.includes(s.id)).length;

  const style = {
    "--fc-steel": palette.steel,
    "--fc-brass": palette.brass,
    "--fc-card": palette.card,
    "--fc-folder": palette.folder,
    "--fc-ink": palette.ink,
  } as CSSProperties;

  return (
    <section style={style} className={`fc @container w-full ${className}`} aria-label={title}>
      <div
        ref={rootRef}
        className="rounded-2xl border border-black/40 p-2.5 shadow-[0_24px_40px_-24px_rgba(20,6,40,.8)] @xl:p-4"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--fc-steel) 80%, black), var(--fc-steel) 6%, color-mix(in srgb, var(--fc-steel) 92%, white) 50%, var(--fc-steel) 94%, color-mix(in srgb, var(--fc-steel) 80%, black))",
        }}
      >
        {/* cabinet top: plate, search, controls */}
        <div className="mb-3 flex flex-wrap items-center gap-2 @xl:mb-4 @xl:gap-3">
          <span
            className="rounded-[4px] px-3 py-1.5 text-lg leading-none tracking-[0.12em] text-[#3b2410] uppercase shadow-[0_1px_2px_rgba(0,0,0,.5),inset_0_1px_0_rgba(255,255,255,.5)] @xl:text-xl"
            style={{
              fontFamily: 'var(--font-display), "Bebas Neue", Impact, sans-serif',
              background: "linear-gradient(180deg, color-mix(in srgb, var(--fc-brass) 55%, white), var(--fc-brass) 50%, color-mix(in srgb, var(--fc-brass) 72%, black))",
            }}
          >
            {title}
          </span>

          {searchable && (
            <div className="relative order-last w-full @xl:order-none @xl:ml-auto @xl:w-64">
              <label htmlFor={`${uid}-search`} className="sr-only">
                Search the FAQ
              </label>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id={`${uid}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="FIND A FILE…"
                autoComplete="off"
                onKeyDown={(e) => e.key === "Escape" && query && (e.preventDefault(), setQuery(""))}
                className="h-10 w-full rounded-md border border-black/50 bg-[#141018] pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none text-[13px] tracking-[0.18em] text-white uppercase shadow-[inset_0_2px_4px_rgba(0,0,0,.6)] [text-shadow:0_1px_0_rgba(255,255,255,.15)] placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-brass)]"
                style={{ fontFamily: TYPE }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--fc-brass)]"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className={`flex items-center gap-2 ${searchable ? "" : "ml-auto"}`}>
            {openShown > 0 && (
              <button
                type="button"
                onClick={closeAll}
                className="h-10 rounded-md bg-white/10 px-3 text-xs font-semibold tracking-[0.12em] text-white/85 uppercase transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-brass)] active:scale-95"
              >
                Close all
              </button>
            )}
            <button
              type="button"
              aria-pressed={sound}
              aria-label={sound ? "Turn drawer sounds off" : "Turn drawer sounds on"}
              onClick={() => setSound((v) => !v)}
              className={`grid size-10 place-items-center rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fc-brass)] active:scale-90 ${
                sound ? "bg-[var(--fc-brass)] text-[#3b2410]" : "bg-white/10 text-white/75 hover:bg-white/20 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 5 6 9H3v6h3l5 4V5z" />
                {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 6 6M22 9l-6 6" />}
              </svg>
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {q ? `${shown.length} of ${items.length} questions match` : ""}
        </p>

        {/* drawers */}
        <div className="flex flex-col gap-2 @xl:gap-2.5">
          {shown.map(({ file, id, code }) => (
            <Drawer
              key={id}
              file={file}
              id={id}
              code={code}
              uid={uid}
              open={open.includes(id)}
              rattling={rattling === id}
              query={q}
              onToggle={toggle}
              onRattleEnd={() => setRattling(null)}
              onNav={onNav}
            />
          ))}

          {shown.length === 0 && (
            <div className="rounded-md border-2 border-dashed border-white/25 px-4 py-8 text-center text-white/80">
              <p className="text-sm tracking-[0.15em] uppercase" style={{ fontFamily: TYPE }}>
                No files match “{q}”
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 h-10 rounded-md bg-[var(--fc-brass)] px-4 text-xs font-bold tracking-[0.15em] text-[#3b2410] uppercase transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* plinth */}
        <div aria-hidden="true" className="mt-3 h-2 rounded-sm bg-black/30" />
      </div>
      {/* feet */}
      <div aria-hidden="true" className="flex justify-between px-[6%]">
        <span className="h-2 w-10 rounded-b-md bg-[#1d1430]/80" />
        <span className="h-2 w-10 rounded-b-md bg-[#1d1430]/80" />
      </div>

      <style>{`
        @keyframes fc-rattle { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-3px) } 40% { transform: translateX(3px) } 60% { transform: translateX(-2px) } 80% { transform: translateX(2px) } }
        .fc .fc-rattle { animation: fc-rattle .32s linear; }
        @keyframes fc-clunk { 0%, 70% { transform: translateY(0) } 82% { transform: translateY(3px) } 100% { transform: translateY(0) } }
        .fc .fc-pulled { animation: fc-clunk .5s ease-out; }
        @media (prefers-reduced-motion: reduce) { .fc .fc-rattle, .fc .fc-pulled { animation: none } }
      `}</style>
    </section>
  );
}

export default FilingCabinetFAQ;
