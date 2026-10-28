/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React hero banner component called <CatRevealHero />.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS.
- It is a client component ("use client"). No animation libraries — drive everything from one requestAnimationFrame clock.

## The animation
1. A hand-drawn black cat walks in from off-screen on the LEFT, moving right along the baseline of the company name.
2. The company name (e.g. "LOFISTACK") is hidden at first and is revealed letter by letter BEHIND the cat as it walks past — use a CSS mask-image linear-gradient whose edge trails the cat's back, with a soft feather. Each letter also rises slightly and fades from 25% to 100% opacity as it is revealed.
3. The cat slows to a gentle stop just AFTER the last letter, its back end lowers, and it cross-fades into a sitting pose next to the name. Once seated, its tail sways slowly forever (CSS keyframes).
4. After the cat sits, the eyebrow pill and tagline fade in.
5. The name + seated cat are centred together: reserve an empty "seat" span after the text (about 0.72em wide) so the layout never shifts.

## The cat (cut-out rig)
- Use a side-view walking illustration and a sitting illustration of the same cat (both facing left in the source art; mirror them with scale(-1, 1) so the cat faces right).
- Split the walking cat into parts: tail, far front leg, far hind leg, body, head (+ ears), near front leg. Store each part as SVG path runs: [tone, d] where tone is 0 fill, 1 shade, 2 line, 3 fur, so the cat can be recoloured with a palette.
- Animate it like a 2D puppet: rotate each leg around its shoulder/hip pivot with a sine wave (lateral-sequence walk: offsets 0, 0.25, 0.5, 0.75), shorten the leg slightly while it swings forward, bob the body twice per stride, nod the head, and swing the tail.
- The near hind leg is part of the body shape: split it off with a clipPath at the knee plus a small circular "ball joint" so the seam never shows.
- Drive the gait phase from distance travelled (distance / stride length), not time, so the paws don't skate at any speed.
- Size the cat from the font's cap height so it always matches the letters, and draw it on an absolutely positioned SVG overlay in section pixels. Add a soft ground shadow ellipse.
- Lazy-load the artwork module with dynamic import() so it stays out of the initial bundle.

## Props (all typed with a TypeScript type)
- companyName?: string = "Lofistack" — revealed text and the accessible heading
- uppercase?: boolean = true
- eyebrow?: string, tagline?: string
- primaryAction?, secondaryAction?: { label: string; href: string; ariaLabel?: string; onClick?: MouseEventHandler } — optional buttons, only rendered when passed
- colors?: Partial<{ brand; background; text; onBrand }> — default brand #351367 on #ffffff
- catPalette?: Partial<{ fill; shade; line; fur }>
- duration?: number = 5 — seconds to walk to the seat
- trigger?: "mount" | "in-view" = "in-view" (IntersectionObserver, 35% threshold)
- loop?: boolean, loopDelay?: number = 2.5
- showReplay?: boolean = true
- reducedMotion?: "auto" | "always" | "never" = "auto"
- fontFamily?: string (tall condensed face, default Bebas Neue), headingLevel?: "h1" | "h2", minHeight?: string, className?: string, onComplete?: () => void
- Never hardcode values that should come from props.

## Responsive
- The name must fit any container: use container query units on the section, e.g. font-size: min(13rem, calc(92cqi / (letters * 0.42 + 0.72))).
- Re-measure text, baseline and letter positions with a ResizeObserver and after document.fonts.ready.
- Must look right on mobile (≈360px), tablet and desktop.

## UI states & accessibility
- The name is real text inside an h1 (visually split into aria-hidden letter spans, plus an sr-only copy of the full name).
- Loading: show a soft pulsing placeholder while fonts, measurements and artwork load (aria-busy on the section).
- Replay button (bottom-right, 44px, aria-label "Replay animation"): spinner + disabled while the cat is walking; hover, focus-visible ring and active press states once enabled.
- prefers-reduced-motion: skip the walk entirely — show the full name, the seated cat (no tail sway) and the copy immediately.
- Without JavaScript: a <noscript> style reveals the name and copy.
- Clamp per-frame deltas (max 50ms) so a backgrounded tab never skips the animation.
- Keep colour contrast at WCAG AA or better.

## Deliverables
- src/components/cat-reveal-hero/CatRevealHero.tsx (component, props, timeline)
- src/components/cat-reveal-hero/BlackCat.tsx (the rig: <Walker /> and <Sitter />)
- src/components/cat-reveal-hero/catArt.ts (the cat artwork as part path runs)
- src/components/cat-reveal-hero/index.ts (exports)
- A usage example:
  <CatRevealHero
    companyName="Lofistack"
    eyebrow="90 Day Build Challenge"
    tagline="Ship calm, considered products — one component at a time."
  />`;
