"use client";

import { useRef } from "react";
import { ElevatorNavbar, type ElevatorFloor } from "@/components/elevator-navbar";

const FLOORS: ElevatorFloor[] = [
  { id: "el-lobby", label: "Lobby", button: "L" },
  { id: "el-about", label: "About" },
  { id: "el-work", label: "Work" },
  { id: "el-pricing", label: "Pricing" },
  { id: "el-contact", label: "Contact" },
];

const SECTIONS = [
  { tone: "#fbf6ff", title: "Welcome to the Lofistack building", body: "Scroll down, or press a floor button. The dial follows you as you scroll, and the lamps show which way you're travelling." },
  { tone: "#f3ecff", title: "About", body: "We make calm, considered UI components, one cozy object at a time." },
  { tone: "#efe5fd", title: "Work", body: "A cat that reveals your name. A vinyl player with a live beat. A radio you tune to a plan." },
  { tone: "#e9ddfb", title: "Pricing", body: "Free for tinkerers, Pro for makers, Team for studios." },
  { tone: "#e2d3f8", title: "Contact", body: "Write us a letter on the typewriter. We reply within a day." },
];

/** A scrollable mini-site so the navbar can be tried inside a preview box. */
export function ElevatorDemo({ height = 560 }: { height?: number }) {
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div ref={scroller} className="@container relative isolate overflow-y-auto rounded-xl border border-border bg-white" style={{ height }}>
      <ElevatorNavbar floors={FLOORS} scrollRoot={() => scroller.current} offset={84} />
      {FLOORS.map((f, i) => (
        <section key={f.id} id={f.id} className="flex min-h-[420px] flex-col justify-center px-6 py-16 @xl:px-12" style={{ background: SECTIONS[i].tone }}>
          <p className="font-mono text-xs font-semibold tracking-[0.25em] text-[#351367]/60 uppercase">Floor {f.button ?? i + 1}</p>
          <h3 className="mt-2 text-2xl font-semibold text-[#351367] @xl:text-4xl">{SECTIONS[i].title}</h3>
          <p className="mt-3 max-w-lg text-[#5d5275]">{SECTIONS[i].body}</p>
        </section>
      ))}
    </div>
  );
}
