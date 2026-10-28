"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { createTypewriterSound, type TypewriterSound } from "./typewriterSound";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ContactData = { name: string; email: string; message: string };

export type TypewriterPalette = {
  /** Machine body. */
  body: string;
  /** Key caps. */
  keys: string;
  /** Paper. */
  paper: string;
  /** Typed text. */
  ink: string;
  /** Error stamps and the return key. */
  stamp: string;
};

export type TypewriterContactFormProps = {
  /** Who the letter is addressed to. */
  recipient?: string;
  /** Send the message. Return a promise: it shows the sending state, and a rejection shows the error state. */
  onSubmit?: (data: ContactData) => void | Promise<void>;
  labels?: Partial<Record<keyof ContactData | "submit", string>>;
  placeholders?: Partial<Record<keyof ContactData, string>>;
  minMessageLength?: number;
  /** Start with typewriter sounds on (users can toggle them). */
  defaultSound?: boolean;
  successTitle?: string;
  successMessage?: string;
  /** Font stack for the typed text. */
  fontFamily?: string;
  palette?: Partial<TypewriterPalette>;
  className?: string;
};

type Errors = Partial<Record<keyof ContactData, string>>;
type Phase = "form" | "pulling" | "folding" | "flying" | "done";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: TypewriterPalette = {
  body: "#351367",
  keys: "#f4ecd8",
  paper: "#fdf8ee",
  ink: "#1f1a2e",
  stamp: "#c8322b",
};

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Stable pseudo-random numbers per character, so the "ink" doesn't shimmer on re-render. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
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

function validate(d: ContactData, minLen: number): Errors {
  const e: Errors = {};
  if (!d.name.trim()) e.name = "Please type your name.";
  if (!d.email.trim()) e.email = "Please type your email address.";
  else if (!EMAIL_RE.test(d.email.trim())) e.email = "That email address doesn't look right.";
  if (d.message.trim().length < minLen) e.message = `Please write at least ${minLen} characters.`;
  return e;
}

const STAMP_TEXT: Record<keyof ContactData, (msg: string) => string> = {
  name: () => "Required",
  email: (m) => (m.startsWith("Please") ? "Required" : "Check email"),
  message: () => "Too short",
};

/* ------------------------------------------------------------------ */
/* A field: a real input with a struck-ink layer drawn over it         */
/* ------------------------------------------------------------------ */

type FieldProps = {
  id: string;
  name: keyof ContactData;
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
  readOnly: boolean;
  animate: boolean;
  onChange: (name: keyof ContactData, v: string) => void;
  onKeyDown: (name: keyof ContactData, e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCaret: (name: keyof ContactData, column: number, width: number) => void;
  inputRef: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
};

function TypedField({
  id,
  name,
  label,
  value,
  placeholder,
  error,
  multiline,
  type = "text",
  autoComplete,
  readOnly,
  animate,
  onChange,
  onKeyDown,
  onCaret,
  inputRef,
}: FieldProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const elRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const errId = `${id}-error`;

  // Keep the ink layer aligned with the real field when it scrolls.
  const sync = () => {
    const el = elRef.current;
    const ov = overlayRef.current;
    if (!el || !ov) return;
    ov.style.transform = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
    if (document.activeElement !== el) return;
    const pos = el.selectionStart ?? value.length;
    const before = el.value.slice(0, pos);
    const column = before.length - (before.lastIndexOf("\n") + 1);
    onCaret(name, column, el.clientWidth);
  };
  useEffect(sync);

  const shared = {
    id,
    name,
    value,
    readOnly,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => onKeyDown(name, e),
    onKeyUp: sync,
    onClick: sync,
    onSelect: sync,
    onScroll: sync,
    spellCheck: name === "message",
    className:
      "tw-input relative z-10 block w-full resize-none border-0 bg-transparent p-0 text-transparent caret-[var(--tw-ink)] outline-none selection:bg-[color-mix(in_srgb,var(--tw-ink)_18%,transparent)] selection:text-transparent",
  };

  return (
    <div className="tw-field relative grid gap-1 @xl:grid-cols-[7.5rem_1fr] @xl:items-baseline @xl:gap-3">
      <label htmlFor={id} className="text-sm tracking-wider text-[var(--tw-ink)]/70 uppercase">
        {label}:
      </label>
      <div className="relative">
        <div className={`relative overflow-hidden border-b-2 border-dotted pb-1 transition-colors ${error ? "border-[var(--tw-stamp)]/70" : "border-[var(--tw-ink)]/25 focus-within:border-[var(--tw-ink)]/60"}`}>
          {multiline ? (
            <textarea
              {...shared}
              rows={5}
              ref={(el) => {
                elRef.current = el;
                inputRef(el);
              }}
              onChange={(e) => onChange(name, e.target.value)}
            />
          ) : (
            <input
              {...shared}
              type={type}
              ref={(el) => {
                elRef.current = el;
                inputRef(el);
              }}
              onChange={(e) => onChange(name, e.target.value)}
            />
          )}
          {/* struck ink */}
          <div
            ref={overlayRef}
            aria-hidden="true"
            className={`tw-input pointer-events-none absolute inset-x-0 top-0 ${multiline ? "break-words whitespace-pre-wrap" : "whitespace-pre"}`}
          >
            {value ? (
              Array.from(value).map((ch, i) => {
                const r1 = rand(i * 7 + ch.charCodeAt(0));
                const r2 = rand(i * 13 + 3);
                return (
                  <span
                    key={i}
                    className={animate ? "tw-strike" : undefined}
                    style={{
                      position: "relative",
                      top: `${((r1 - 0.5) * 1.6).toFixed(2)}px`,
                      opacity: 0.74 + r2 * 0.26,
                    }}
                  >
                    {ch}
                  </span>
                );
              })
            ) : (
              <span className="text-[var(--tw-ink)]/30">{placeholder}</span>
            )}
            {multiline && "​"}
          </div>
        </div>
        {error && (
          <span
            id={errId}
            className="tw-stamp pointer-events-none absolute -top-3 right-0 z-20 rotate-[-7deg] rounded-sm border-2 border-[var(--tw-stamp)] px-2 py-0.5 text-[11px] font-bold tracking-[0.18em] text-[var(--tw-stamp)] uppercase mix-blend-multiply"
          >
            <span aria-hidden="true">{STAMP_TEXT[name](error)}</span>
            <span className="sr-only">{error}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function TypewriterContactForm({
  recipient = "Lofistack",
  onSubmit,
  labels: labelOverrides,
  placeholders: placeholderOverrides,
  minMessageLength = 10,
  defaultSound = true,
  successTitle = "Letter sent!",
  successMessage = "Thanks for writing. We read every letter and usually reply within a day.",
  fontFamily = 'var(--font-typewriter, "Special Elite"), "Courier Prime", "Courier New", ui-monospace, monospace',
  palette: paletteOverrides,
  className = "",
}: TypewriterContactFormProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const labels = { name: "From", email: "Reply to", message: "Message", submit: "Return · Send", ...labelOverrides };
  const placeholders = {
    name: "Your name",
    email: "you@example.com",
    message: "Type your letter here…",
    ...placeholderOverrides,
  };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduced = usePrefersReducedMotion();

  const [data, setData] = useState<ContactData>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [phase, setPhase] = useState<Phase>("form");
  const [pressed, setPressed] = useState<string | null>(null);
  const [carriage, setCarriage] = useState(0);
  const [sound, setSound] = useState(defaultSound);

  const fields = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const soundRef = useRef<TypewriterSound | null>(null);
  const play = useCallback(
    (k: keyof TypewriterSound) => {
      if (!sound || k === "dispose") return;
      soundRef.current ??= createTypewriterSound();
      soundRef.current?.[k]();
    },
    [sound],
  );
  useEffect(() => () => soundRef.current?.dispose(), []);

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const busy = status === "sending" || phase !== "form";

  /* ---------- Typing feedback ---------- */

  const pressTimer = useRef<number | undefined>(undefined);
  const flash = (key: string) => {
    setPressed(key);
    window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setPressed(null), 110);
  };
  const dinged = useRef<Record<string, boolean>>({});

  const onKeyDown = (name: keyof ContactData, e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (busy) return;
    if (e.key === "Enter") {
      if (e.metaKey || e.ctrlKey) return; // Cmd/Ctrl+Enter submits (handled by the form)
      play("ding");
      flash("RETURN");
      dinged.current[name] = false;
      if (name !== "message") {
        // Enter on a single-line field moves to the next line, like a carriage return.
        e.preventDefault();
        const order: (keyof ContactData)[] = ["name", "email", "message"];
        fields.current[order[order.indexOf(name) + 1]]?.focus();
      }
      return;
    }
    if (e.key === "Backspace") {
      play("clack");
      flash("BACK");
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      play("clack");
      flash(e.key === " " ? "SPACE" : e.key.toUpperCase());
    }
  };

  const onCaret = (name: keyof ContactData, column: number, width: number) => {
    const cols = Math.max(10, Math.floor(width / 9.5));
    // Long lines wrap on the page, so the carriage follows the visual line.
    const ratio = Math.min(1, (column % cols) / cols);
    setCarriage((prev) => (Math.abs(prev - ratio) > 0.001 ? ratio : prev));
    // The bell rings once as you near the end of a line.
    if (ratio > 0.86 && !dinged.current[name]) {
      dinged.current[name] = true;
      play("ding");
    } else if (ratio < 0.5) {
      dinged.current[name] = false;
    }
  };

  const update = (name: keyof ContactData, v: string) => {
    const next = { ...data, [name]: v };
    setData(next);
    if (status === "error") setStatus("idle");
    if (submitted) setErrors(validate(next, minMessageLength));
  };

  /* ---------- Sending ---------- */

  // While sending, the keys tap away on their own.
  useEffect(() => {
    if (status !== "sending" || reduced) return;
    const letters = KEY_ROWS.join("");
    const id = window.setInterval(() => {
      setPressed(letters[Math.floor(Math.random() * letters.length)]);
    }, 120);
    return () => {
      window.clearInterval(id);
      setPressed(null);
    };
  }, [status, reduced]);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const errs = validate(data, minMessageLength);
    setErrors(errs);
    if (Object.keys(errs).length) {
      play("ding");
      const first = (["name", "email", "message"] as const).find((k) => errs[k]);
      if (first) fields.current[first]?.focus();
      return;
    }
    setStatus("sending");
    try {
      await (onSubmit ? onSubmit({ ...data, name: data.name.trim(), email: data.email.trim() }) : new Promise((r) => setTimeout(r, 1400)));
      setStatus("idle");
      play("zip");
      if (reduced) {
        setPhase("done");
        return;
      }
      setPhase("pulling");
      after(550, () => setPhase("folding"));
      after(1250, () => setPhase("flying"));
      after(2000, () => setPhase("done"));
    } catch {
      setStatus("error");
      play("ding");
    }
  };

  const reset = () => {
    setData({ name: "", email: "", message: "" });
    setErrors({});
    setSubmitted(false);
    setStatus("idle");
    setPhase("form");
    setCarriage(0);
    after(50, () => fields.current.name?.focus());
  };

  /* ---------- Render ---------- */

  const style = {
    "--tw-body": palette.body,
    "--tw-keys": palette.keys,
    "--tw-paper": palette.paper,
    "--tw-ink": palette.ink,
    "--tw-stamp": palette.stamp,
    "--tw-font": fontFamily,
  } as CSSProperties;

  const paperTransform =
    phase === "pulling"
      ? "translateY(-18%)"
      : phase === "folding" || phase === "flying"
        ? "translateY(-18%) scaleY(0.18)"
        : "translateY(0)";

  const key = (k: string, cls = "", label?: string) => (
    <span
      key={k}
      aria-hidden="true"
      className={`flex items-center justify-center rounded-full border-b-[3px] text-[10px] font-bold text-[#2b2236] shadow-[0_2px_0_rgba(0,0,0,.35)] transition-transform duration-75 ${
        pressed === k ? "translate-y-[3px] border-b-0 bg-[color-mix(in_srgb,var(--tw-keys)_80%,black)]" : "border-black/30 bg-[var(--tw-keys)]"
      } ${cls}`}
    >
      {label ?? k}
    </span>
  );

  return (
    <section style={style} className={`tw @container w-full ${className}`}>
      <form onSubmit={submit} noValidate aria-label={`Write a letter to ${recipient}`} className="relative mx-auto max-w-2xl" onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.requestSubmit();
      }}>
        {/* ---------- Paper ---------- */}
        <div className="relative z-10 mx-auto w-[90%] @xl:w-[84%]" style={{ perspective: "900px" }}>
          {phase !== "done" ? (
            <div
              className="relative origin-bottom rounded-t-sm bg-[var(--tw-paper)] px-5 pt-7 pb-14 shadow-[0_-4px_20px_rgba(40,20,60,.12)] transition-[transform,opacity] ease-in-out @xl:px-9 @xl:pt-9"
              style={{
                transform: paperTransform,
                opacity: phase === "folding" || phase === "flying" ? 0 : 1,
                transitionDuration: phase === "pulling" ? "500ms" : "600ms",
                fontFamily: "var(--tw-font)",
                backgroundImage:
                  "radial-gradient(circle at 20% 10%, rgba(255,255,255,.7), transparent 40%), repeating-linear-gradient(0deg, rgba(60,40,20,.025) 0 1px, transparent 1px 3px)",
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-[var(--tw-ink)]/80">
                <span>To: {recipient}</span>
                <span>{today}</span>
              </div>
              <p className="mt-4 mb-6 text-[var(--tw-ink)]">Dear {recipient},</p>

              <div className="grid gap-6">
                <TypedField
                  id={`${uid}-name`}
                  name="name"
                  label={labels.name}
                  value={data.name}
                  placeholder={placeholders.name}
                  error={errors.name}
                  autoComplete="name"
                  readOnly={busy}
                  animate={!reduced}
                  onChange={update}
                  onKeyDown={onKeyDown}
                  onCaret={onCaret}
                  inputRef={(el) => (fields.current.name = el)}
                />
                <TypedField
                  id={`${uid}-email`}
                  name="email"
                  type="email"
                  label={labels.email}
                  value={data.email}
                  placeholder={placeholders.email}
                  error={errors.email}
                  autoComplete="email"
                  readOnly={busy}
                  animate={!reduced}
                  onChange={update}
                  onKeyDown={onKeyDown}
                  onCaret={onCaret}
                  inputRef={(el) => (fields.current.email = el)}
                />
                <TypedField
                  id={`${uid}-message`}
                  name="message"
                  multiline
                  label={labels.message}
                  value={data.message}
                  placeholder={placeholders.message}
                  error={errors.message}
                  readOnly={busy}
                  animate={!reduced}
                  onChange={update}
                  onKeyDown={onKeyDown}
                  onCaret={onCaret}
                  inputRef={(el) => (fields.current.message = el)}
                />
              </div>

              <p className="mt-6 text-right text-xs text-[var(--tw-ink)]/45">
                {data.message.length} chars · Cmd/Ctrl + Enter to send
              </p>

              {status === "error" && (
                <div role="alert" className="tw-stamp absolute top-6 right-6 rotate-[8deg] rounded border-[3px] border-double border-[var(--tw-stamp)] px-3 py-1 text-center text-[var(--tw-stamp)] mix-blend-multiply">
                  <p className="text-sm font-bold tracking-[0.2em] uppercase">Not sent</p>
                  <p className="text-[10px] tracking-wide">Please try again</p>
                </div>
              )}
            </div>
          ) : (
            <div
              role="status"
              className="tw-rise relative rounded-t-sm bg-[var(--tw-paper)] px-6 pt-10 pb-16 text-center shadow-[0_-4px_20px_rgba(40,20,60,.12)] @xl:px-10"
              style={{ fontFamily: "var(--tw-font)" }}
            >
              <svg viewBox="0 0 64 48" className="mx-auto h-12 w-16 text-[var(--tw-body)]" aria-hidden="true">
                <rect x="2" y="6" width="60" height="40" rx="3" fill="var(--tw-paper)" stroke="currentColor" strokeWidth="2.5" />
                <path d="M3 8 L32 30 L61 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-4 text-2xl text-[var(--tw-ink)]">{successTitle}</h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--tw-ink)]/75">{successMessage}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[var(--tw-ink)] px-5 text-sm text-[var(--tw-ink)] transition hover:bg-[var(--tw-ink)] hover:text-[var(--tw-paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tw-ink)] active:scale-95"
              >
                Write another letter
              </button>
            </div>
          )}

          {/* Envelope that the letter folds into */}
          {(phase === "folding" || phase === "flying") && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-[22%] z-30 mx-auto w-40 transition-[transform,opacity] duration-700 ease-in @xl:w-48"
              style={{
                transform: phase === "flying" ? "translate(170%, -190%) rotate(16deg) scale(.45)" : "translate(0,0)",
                opacity: phase === "flying" ? 0 : 1,
              }}
            >
              <svg viewBox="0 0 200 130" className="tw-env-in w-full drop-shadow-[0_12px_18px_rgba(30,10,50,.35)]">
                <rect x="2" y="2" width="196" height="126" rx="6" fill="var(--tw-paper)" stroke="#d8ccb4" strokeWidth="2" />
                <path d="M2 128 L100 62 L198 128" fill="none" stroke="#d8ccb4" strokeWidth="2" />
                <path className="tw-flap" d="M2 4 L100 76 L198 4 Z" fill="color-mix(in srgb, var(--tw-paper) 88%, black)" stroke="#d8ccb4" strokeWidth="2" />
                <circle cx="100" cy="74" r="13" fill="var(--tw-stamp)" />
                <text x="100" y="79" textAnchor="middle" fontSize="13" fill="#fff" fontFamily="serif" fontWeight="700">
                  {recipient.charAt(0)}
                </text>
              </svg>
            </div>
          )}
        </div>

        {/* ---------- Machine ---------- */}
        <div className="relative z-20 -mt-10 rounded-t-[22px] rounded-b-[34px] bg-[linear-gradient(170deg,color-mix(in_srgb,var(--tw-body)_75%,white),var(--tw-body)_40%,color-mix(in_srgb,var(--tw-body)_65%,black))] px-4 pt-9 pb-5 shadow-[0_30px_50px_-20px_rgba(30,8,60,.6)] @xl:px-8 @xl:pb-7">
          {/* roller */}
          <div aria-hidden="true" className="absolute -top-4 right-[-10px] left-[-10px] flex items-center">
            <span className="size-9 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#b9b4c4_45%,#4a4458)] shadow-md" />
            <span className="h-8 flex-1 rounded-sm bg-[linear-gradient(180deg,#3b3344,#120d18_55%,#2a2333)] shadow-[inset_0_2px_3px_rgba(255,255,255,.15)]" />
            <span className="size-9 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#b9b4c4_45%,#4a4458)] shadow-md" />
          </div>

          {/* carriage scale */}
          <div aria-hidden="true" className="relative mx-auto mb-4 h-4 w-[84%]">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
            {Array.from({ length: 21 }, (_, i) => (
              <span key={i} className="absolute top-1/2 w-px -translate-y-1/2 bg-white/35" style={{ left: `${i * 5}%`, height: i % 5 === 0 ? 10 : 5 }} />
            ))}
            <span
              className="absolute -top-0.5 size-0 -translate-x-1/2 border-x-[6px] border-t-[9px] border-x-transparent border-t-[var(--tw-keys)] transition-[left] duration-100"
              style={{ left: `${carriage * 100}%` }}
            />
          </div>

          <div className="mb-4 flex justify-center">
            <span className="rounded bg-[linear-gradient(180deg,#f3d9a4,#c9a15f)] px-3 py-0.5 text-[10px] font-bold tracking-[0.3em] text-[#3b2410] shadow-inner">
              {recipient.toUpperCase()} · MODEL 90
            </span>
          </div>

          {/* keys */}
          <div className="hidden flex-col items-center gap-1.5 @xl:flex">
            {KEY_ROWS.map((row, r) => (
              <div key={row} className="flex gap-1.5" style={{ paddingLeft: r * 14 }}>
                {Array.from(row).map((k) => key(k, "size-8"))}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              aria-pressed={sound}
              aria-label={sound ? "Turn typewriter sounds off" : "Turn typewriter sounds on"}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white/80 ring-1 ring-white/20 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tw-keys)] active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                {sound ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="m17 9 5 6m0-6-5 6" />}
              </svg>
            </button>
            {key("SPACE", "hidden h-8 flex-1 rounded-lg @xl:flex", "")}
            <button
              type="submit"
              disabled={phase !== "form"}
              aria-busy={status === "sending" || undefined}
              className={`relative ml-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-b-4 px-5 text-sm font-bold tracking-[0.15em] text-white uppercase shadow-[0_3px_0_rgba(0,0,0,.35)] transition-[transform,filter,border] duration-75 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--tw-keys)] active:translate-y-[3px] active:border-b-0 disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-wait @max-xl:flex-1 @xl:px-6 ${
                pressed === "RETURN" ? "translate-y-[3px] border-b-0" : "border-black/35"
              }`}
              style={{ background: "var(--tw-stamp)", fontFamily: "var(--tw-font)" }}
            >
              {status === "sending" ? (
                <>
                  <svg viewBox="0 0 24 24" className="size-4 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                  Sending…
                </>
              ) : status === "error" ? (
                "Try again ⏎"
              ) : (
                <>{labels.submit} ⏎</>
              )}
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {status === "sending" ? "Sending your letter…" : phase === "done" ? `${successTitle} ${successMessage}` : ""}
        </p>
      </form>

      <style>{`
        .tw .tw-input { font-family: var(--tw-font); font-size: 1.0625rem; line-height: 1.75rem; letter-spacing: .02em; color: var(--tw-ink); }
        .tw input.tw-input, .tw textarea.tw-input { color: transparent; }
        @keyframes tw-strike { 0% { opacity: 0; top: -3px; text-shadow: 0 0 0 transparent } 40% { opacity: 1; text-shadow: 0 0 1.5px var(--tw-ink) } 100% {} }
        .tw .tw-strike { animation: tw-strike .16s ease-out both; }
        @keyframes tw-stamp { 0% { transform: rotate(-7deg) scale(1.8); opacity: 0 } 60% { opacity: .95 } 100% { transform: rotate(-7deg) scale(1); opacity: .9 } }
        .tw .tw-stamp { animation: tw-stamp .22s cubic-bezier(.2,.9,.3,1.3) both; }
        @keyframes tw-rise { from { transform: translateY(40px); opacity: 0 } to { transform: none; opacity: 1 } }
        .tw .tw-rise { animation: tw-rise .6s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes tw-env-in { from { transform: scale(.7); opacity: 0 } to { transform: none; opacity: 1 } }
        .tw .tw-env-in { animation: tw-env-in .35s ease-out both; }
        @keyframes tw-flap { from { transform: scaleY(-1) } to { transform: scaleY(1) } }
        .tw .tw-flap { transform-box: fill-box; transform-origin: top; animation: tw-flap .45s .25s ease-in-out both; }
        @media (prefers-reduced-motion: reduce) { .tw .tw-strike, .tw .tw-stamp, .tw .tw-rise, .tw .tw-env-in, .tw .tw-flap { animation: none } }
      `}</style>
    </section>
  );
}

export default TypewriterContactForm;
