"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CopyButton } from "./CopyButton";

export type CodeFile = {
  name: string;
  /** Raw source, used by the copy button. */
  code: string;
  /** Pre-highlighted HTML (from Shiki). Falls back to plain text when missing. */
  html?: string;
  note?: string;
};

type CodeTabsProps = {
  files: CodeFile[];
  label: string;
  className?: string;
  maxHeight?: string;
};

/** Accessible tabbed code viewer (roving tabindex, arrow-key navigation). */
export function CodeTabs({ files, label, className = "", maxHeight = "34rem" }: CodeTabsProps) {
  const [active, setActive] = useState(0);
  const base = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = files[Math.min(active, files.length - 1)];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: -Infinity,
      End: Infinity,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const step = keys[e.key];
    const next =
      step === -Infinity ? 0 : step === Infinity ? files.length - 1 : (active + step + files.length) % files.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#2a1d45] bg-[#120a20] shadow-xl ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pr-2 pl-1">
        <div
          role="tablist"
          aria-label={label}
          onKeyDown={onKeyDown}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]"
        >
          {files.map((file, i) => {
            const selected = i === active;
            return (
              <button
                key={file.name}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                type="button"
                id={`${base}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${base}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-xs transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b48cff] ${
                  selected ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/6 hover:text-white/90"
                }`}
              >
                {file.name}
              </button>
            );
          })}
        </div>
        <CopyButton value={current.code} label={`Copy ${current.name}`} />
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${active}`}
        tabIndex={0}
        className="code-block overflow-auto text-white/90 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b48cff]"
        style={{ maxHeight }}
      >
        {current.note && (
          <p className="border-b border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs text-white/60">{current.note}</p>
        )}
        {current.html ? (
          <div dangerouslySetInnerHTML={{ __html: current.html }} />
        ) : (
          <pre>
            <code>{current.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
