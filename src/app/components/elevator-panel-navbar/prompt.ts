/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React navbar called <ElevatorNavbar /> that looks and works like the button panel of a vintage elevator.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS (v4 container queries).
- Client component ("use client"). No UI, animation or audio libraries.

## Look
- A sticky bar styled as a dark purple elevator panel (#24103f) with brass trim, four small brass screws in the corners and a soft inner shadow.
- Left: a brass name plate ("LOFISTACK"), then a half-moon floor indicator dial — an arc with a tick and a number per floor and an amber needle pivoting from the bottom centre. The lit floor number glows amber.
- Next to the dial: two small triangle direction lamps (up / down) that light while the page is scrolling that way.
- Right (wide): one round brass push-button per floor showing its number (or "L" for the lobby) with the floor name under it. The current floor's button is lit with an amber ring and glow. Hover raises the button, active presses it in.
- A small speaker button toggles the arrival chime.
- Narrow: hide the name plate and the floor buttons; show the dial, the current floor name and a "Choose a floor" button that opens a dropdown panel of the same brass buttons.
- Use container queries (@container on the nav; @md and @3xl variants), so it adapts to its own width, not the window.

## Behaviour
- Props give a list of floors { id, label, button? }; each id is a section on the page.
- Scroll spy: on scroll (rAF-throttled) measure each section's top relative to the scroll root and work out a fractional position between floors, so the needle glides between numbers instead of jumping. Reaching the bottom of the page counts as the last floor. Recompute on resize.
- Direction lamps: compare scroll positions; light up or down, and switch off ~350 ms after scrolling stops.
- Pressing a floor: prevent the default jump, then (a) elevator doors — two brushed-steel door panels with brass handles slide closed over the scroll area (280 ms), the floor number lamp shows above them, the page jumps to the section, then the doors slide open (420 ms); (b) optional two-note "ding" (Web Audio, two sine tones a major third apart with a soft decay); (c) call onNavigate(floor).
- Support a custom scroll container via scrollRoot (defaults to the window) and an offset for the sticky bar height.

## States
- Current floor (aria-current="location" + lit button), hover, focus-visible, active/pressed, travelling (doors closed, buttons ignored), dropdown open/closed, sound on/off.

## Accessibility
- <nav aria-label="Main">; every floor is a real <a href="#id"> so it works without JavaScript and can be opened in a new tab.
- The dial and lamps are aria-hidden; a polite live region says "Floor 3, Pricing" when you arrive.
- Dropdown toggle has aria-expanded / aria-controls; it closes on Escape (focus back to the toggle) or an outside click, and focuses the current floor when it opens.
- prefers-reduced-motion: no doors, no needle easing, instant scroll.

## Props (typed)
floors (required), brand = "LOFISTACK", scrollRoot, offset = 96, doors = true, defaultSound = false, onNavigate(floor), palette { panel, brass, lamp, text }, className.

## Files
- src/components/elevator-navbar/ElevatorNavbar.tsx
- src/components/elevator-navbar/index.ts`;
