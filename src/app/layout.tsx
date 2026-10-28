import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lofistack UI — component library",
    template: "%s · Lofistack UI",
  },
  description:
    "Reusable, accessible React + TypeScript + Tailwind components built for the Lofistack 90 Day Build Challenge.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <span className="font-display text-2xl leading-none tracking-[0.06em] text-brand">LOFISTACK</span>
              <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand">
                UI
              </span>
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1 text-sm">
              <Link
                href="/components/"
                className="rounded-md px-3 py-2 font-medium text-muted transition hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
              >
                Components
              </Link>
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Lofistack UI · 90 Day Build Challenge — Track A</p>
            <p>React · Next.js · TypeScript · Tailwind CSS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
