import type { Metadata } from "next";
import { ComponentCard } from "@/components/site/ComponentCard";
import { byWeek } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "Every component in the Lofistack UI library, week by week — each with a live preview, copyable code and its prompt.",
};

export default function ComponentsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10">
        <h1 className="font-display text-5xl leading-none tracking-[0.04em] text-brand sm:text-6xl">Components</h1>
        <p className="mt-3 max-w-2xl text-muted">
          One page per component, with a live preview, copyable code and the prompt behind it.
        </p>
      </header>
      {byWeek().map(({ week, items }) => (
        <section key={week} aria-labelledby={`week-${week}`} className="mb-12">
          <h2 id={`week-${week}`} className="mb-4 flex items-center gap-3 text-sm font-semibold tracking-wide text-muted uppercase">
            Week {week}
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="font-normal normal-case">{items.length} component{items.length === 1 ? "" : "s"}</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <ComponentCard key={c.slug} entry={c} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
