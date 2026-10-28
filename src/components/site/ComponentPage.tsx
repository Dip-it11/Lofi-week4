import Link from "next/link";
import { CodeTabs, type CodeFile } from "@/components/site/CodeTabs";
import { CopyButton } from "@/components/site/CopyButton";
import type { ReactNode } from "react";
import { componentLabel, type ComponentEntry } from "@/lib/registry";

const STACK = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4"];

export type PropDoc = { name: string; type: string; default?: string; description: string };

export type ComponentPageProps = {
  entry: ComponentEntry;
  /** Highlighted files; the first one is the usage example. */
  files: CodeFile[];
  /** Folder the component lives in, e.g. "src/components/vinyl-card". */
  importDir: string;
  /** The live preview. */
  preview: ReactNode;
  previewDescription: string;
  codeDescription: string;
  /** Three short install steps: [title, body]. */
  setup: [string, string][];
  prompt: string;
  props: PropDoc[];
  propsDescription: string;
  features: string[];
  credits?: ReactNode;
};

/** Shared layout for every component page: header, preview, code, prompt and props. */
export function ComponentPage({
  entry,
  files,
  importDir,
  preview,
  previewDescription,
  codeDescription,
  setup,
  prompt: PROMPT,
  props: PROPS,
  propsDescription,
  features: FEATURES,
  credits,
}: ComponentPageProps) {
  const allCode = files
    .filter((f) => f.name !== "Usage.tsx")
    .map((f) => `// ===== ${importDir}/${f.name} =====\n\n${f.code}`)
    .join("\n\n");
  const label = componentLabel(entry);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="rounded hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/components/" className="rounded hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">
              Week {entry.week}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-foreground">
            {entry.name}
          </li>
        </ol>
      </nav>

      {/* ---------- Header ---------- */}
      <header className="mb-8 grid gap-6 lg:mb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold tracking-wide text-white sm:text-sm">
            <span className="font-display text-base leading-none tracking-[0.08em] sm:text-lg">W{entry.week}</span>
            <span className="h-3.5 w-px bg-white/40" aria-hidden />
            {label}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-[0.04em] text-brand sm:text-7xl">{entry.name}</h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{entry.summary}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Tags">
            {entry.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-muted">
                {tag}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-border bg-white p-5 text-sm shadow-sm sm:grid-cols-4 lg:w-80 lg:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Category</dt>
            <dd className="font-semibold">{entry.category}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Added</dt>
            <dd className="font-semibold">
              {new Date(entry.addedOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Files</dt>
            <dd className="font-semibold">{files.length - 1}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Dependencies</dt>
            <dd className="font-semibold">None</dd>
          </div>
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <dt className="sr-only">Stack</dt>
            <dd className="flex flex-wrap gap-1.5">
              {STACK.map((s) => (
                <span key={s} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  {s}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </header>

      {/* ---------- Section nav ---------- */}
      <nav aria-label="On this page" className="sticky top-14 z-30 -mx-4 mb-6 border-y border-border/70 bg-background/90 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <ol className="flex gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
          {[
            ["preview", "Preview"],
            ["code", "Code"],
            ["prompt", "Prompt"],
            ["props", "Props"],
          ].map(([id, text], i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap text-muted transition hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                <span className="font-mono text-xs text-brand/60">0{i + 1}</span>
                {text}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ---------- 01 Preview ---------- */}
      <section id="preview" aria-labelledby="preview-heading" className="scroll-mt-32">
        <SectionHeading id="preview-heading" index="01" title="Preview" description={previewDescription} />
        {preview}
      </section>

      {/* ---------- 02 Code ---------- */}
      <section id="code" aria-labelledby="code-heading" className="mt-14 scroll-mt-32">
        <SectionHeading
          id="code-heading"
          index="02"
          title="Code"
          description={codeDescription}
          action={<CopyButton value={allCode} label="Copy all component files" text="Copy all files" variant="light" />}
        />
        <ol className="mb-5 grid gap-3 text-sm text-muted sm:grid-cols-3">
          {setup.map(([title, body], i) => (
            <li key={title} className="flex gap-3 rounded-xl border border-border bg-white p-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-foreground">{title}</span>
                {body}
              </span>
            </li>
          ))}
        </ol>
        <CodeTabs files={files} label="Component files" maxHeight="40rem" />
      </section>

      {/* ---------- 03 Prompt ---------- */}
      <section id="prompt" aria-labelledby="prompt-heading" className="mt-14 scroll-mt-32">
        <SectionHeading
          id="prompt-heading"
          index="03"
          title="Prompt"
          description="The final prompt behind this component. Paste it into an AI coding assistant to rebuild or adapt it."
          action={<CopyButton value={PROMPT} label="Copy prompt" text="Copy prompt" variant="light" />}
        />
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-[#f7f4fc] px-4 py-2.5">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
              <svg viewBox="0 0 24 24" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 5h16v11H8l-4 4z" />
                <path d="M8 9h8M8 12h5" />
              </svg>
              prompt.md · {PROMPT.split(/\s+/).length} words
            </p>
            <CopyButton value={PROMPT} label="Copy prompt" variant="light" />
          </div>
          <pre
            tabIndex={0}
            aria-label="Component prompt"
            className="max-h-[36rem] overflow-auto p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:p-6"
          >
            {PROMPT}
          </pre>
        </div>
      </section>

      {/* ---------- 04 Props ---------- */}
      <section id="props" aria-labelledby="props-heading" className="mt-14 scroll-mt-32">
        <SectionHeading id="props-heading" index="04" title="Props" description={propsDescription} />
        {/* Cards on small screens */}
        <ul className="grid gap-3 md:hidden">
          {PROPS.map((p) => (
            <li key={p.name} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <code className="font-mono text-sm font-semibold text-brand">{p.name}</code>
                {p.default && <code className="font-mono text-xs text-muted">= {p.default}</code>}
              </div>
              <code className="mt-1 block font-mono text-xs break-words text-foreground">{p.type}</code>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-2xl border border-border bg-white shadow-sm md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-[#f7f4fc] text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Prop</th>
                <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                <th scope="col" className="px-4 py-3 font-semibold">Default</th>
                <th scope="col" className="px-4 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PROPS.map((p) => (
                <tr key={p.name} className="align-top hover:bg-[#fbf9fe]">
                  <th scope="row" className="px-4 py-3 font-mono text-[13px] font-semibold text-brand">{p.name}</th>
                  <td className="px-4 py-3 font-mono text-[13px] text-foreground">{p.type}</td>
                  <td className="px-4 py-3 font-mono text-[13px] text-muted">{p.default ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-relaxed text-muted">
              <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {credits && <p className="mt-12 border-t border-border pt-6 text-xs text-muted">{credits}</p>}
    </div>
  );
}

function SectionHeading({
  id,
  index,
  title,
  description,
  action,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-xs font-semibold text-brand/70">{index}</p>
        <h2 id={id} className="font-display text-4xl leading-none tracking-[0.04em] text-brand">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}
