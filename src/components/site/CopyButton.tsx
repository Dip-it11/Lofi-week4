"use client";

import { useEffect, useState } from "react";

type CopyButtonProps = {
  value: string;
  /** Accessible name. */
  label?: string;
  /** Visible text (defaults to "Copy"). */
  text?: string;
  /** "dark" for use on code panels, "light" for use on the page. */
  variant?: "dark" | "light";
  className?: string;
};

const VARIANTS = {
  dark: "border-white/15 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline-[#b48cff]",
  light:
    "border-border bg-white text-brand shadow-xs hover:border-[#cbbfe3] hover:bg-brand-soft focus-visible:outline-brand",
};

export function CopyButton({ value, label = "Copy code", text = "Copy", variant = "dark", className = "" }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const id = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(id);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // Fallback for browsers / iframes without the async clipboard API.
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        setState(ok ? "copied" : "error");
      } catch {
        setState("error");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 sm:text-sm ${VARIANTS[variant]} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {state === "copied" ? (
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
          </>
        )}
      </svg>
      <span aria-live="polite">{state === "copied" ? "Copied!" : state === "error" ? "Copy failed" : text}</span>
    </button>
  );
}
