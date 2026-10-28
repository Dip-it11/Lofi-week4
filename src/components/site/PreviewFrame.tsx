"use client";

import { useState, type ReactNode } from "react";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: Record<Viewport, { label: string; width: string }> = {
  desktop: { label: "Desktop", width: "100%" },
  tablet: { label: "Tablet", width: "768px" },
  mobile: { label: "Mobile", width: "390px" },
};

type PreviewFrameProps = {
  /** Short hint next to "Live preview". */
  note?: string;
  /** Extra controls in the toolbar (e.g. a toggle). */
  tools?: ReactNode;
  /** Render prop so the preview can remount on restart. */
  children: (runKey: string) => ReactNode;
};

/** Toolbar with width switcher + restart, around a live component preview. */
export function PreviewFrame({ note, tools, children }: PreviewFrameProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [run, setRun] = useState(0);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live preview
          {note && <span className="hidden font-normal text-muted sm:inline">· {note}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {tools}
          <div role="group" aria-label="Preview width" className="flex rounded-lg border border-border bg-[#f4f1fa] p-0.5">
            {(Object.keys(VIEWPORTS) as Viewport[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={viewport === v}
                onClick={() => setViewport(v)}
                className={`h-8 rounded-md px-2.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-brand sm:px-3 ${
                  viewport === v ? "bg-white text-brand shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {VIEWPORTS[v].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 sm:text-sm"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Reset
          </button>
        </div>
      </div>
      <div className="bg-[repeating-linear-gradient(45deg,#f6f3fb_0_10px,#fbfaff_10px_20px)] p-3 sm:p-4">
        <div
          className="mx-auto rounded-xl border border-border bg-[#fbfaff] px-3 py-8 transition-[max-width] duration-500 sm:px-6 sm:py-12"
          style={{ maxWidth: VIEWPORTS[viewport].width }}
        >
          {children(`${run}-${viewport}`)}
        </div>
      </div>
    </div>
  );
}
