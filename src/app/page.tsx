import Link from "next/link";
import { CatRevealHero } from "@/components/cat-reveal-hero";
import { ComponentCard } from "@/components/site/ComponentCard";
import { byWeek } from "@/lib/registry";

export default function Home() {
  return (
    <>
      <CatRevealHero
        companyName="Lofistack"
        eyebrow="Lofistack UI · 90 Day Build Challenge"
        tagline="A growing library of reusable, accessible React components — one new piece every week."
        trigger="mount"
        headingLevel="h1"
        minHeight="min(70svh, 640px)"
      />
      <section aria-labelledby="latest-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="latest-heading" className="font-display text-4xl leading-none tracking-[0.04em] text-brand">
            Components
          </h2>
          <Link
            href="/components/"
            className="rounded text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View all
          </Link>
        </div>
        {byWeek().map(({ week, items }) => (
          <div key={week} className="mb-10">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">Week {week}</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <ComponentCard key={c.slug} entry={c} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
