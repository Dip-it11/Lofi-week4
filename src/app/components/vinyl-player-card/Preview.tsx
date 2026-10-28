"use client";

import { useState } from "react";
import { VinylCard } from "@/components/vinyl-card";

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORTS: Record<Viewport, { label: string; width: string }> = {
  desktop: { label: "Desktop", width: "100%" },
  tablet: { label: "Tablet", width: "768px" },
  mobile: { label: "Mobile", width: "390px" },
};

/** Live preview: four cards showing the default, custom palette, dark and disabled variants. */
export function Preview() {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live preview
          <span className="hidden font-normal text-muted sm:inline">· first card has sound</span>
        </p>
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
      </div>
      <div className="bg-[repeating-linear-gradient(45deg,#f6f3fb_0_10px,#fbfaff_10px_20px)] p-3 sm:p-4">
        <div
          className="mx-auto rounded-xl border border-border bg-[#fbfaff] p-4 transition-[max-width] duration-500 [container-type:inline-size] sm:p-6"
          style={{ maxWidth: VIEWPORTS[viewport].width }}
        >
          <div className="mx-auto grid max-w-3xl grid-cols-1 justify-items-center gap-5 @[620px]:grid-cols-2">
            <VinylCard title="Midnight Commit" artist="Lofistack" demoSound duration={96} badge="Sound on" />
            <VinylCard
              title="Rainy Deploy"
              artist="Lo-fi Pipelines"
              duration={154}
              palette={{ sky: ["#0f3b57", "#6fb7c7"], sun: "#f4e9cd", land: "#0b2235", label: "#f4e9cd", accent: "#0f5f7a" }}
            />
            <VinylCard
              title="Coffee & Code"
              artist="Lofistack Radio"
              tone="dark"
              duration={201}
              palette={{ sky: ["#3b1d10", "#e0874a"], sun: "#ffe0a3", land: "#1c0c06", label: "#e0874a", accent: "#c2672f" }}
            />
            <VinylCard
              title="Sunday Refactor"
              artist="Lofistack"
              disabled
              badge="Coming soon"
              palette={{ sky: ["#2d3a1f", "#a6c48a"], sun: "#fff4c2", land: "#18200f", label: "#a6c48a", accent: "#4f6b35" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
