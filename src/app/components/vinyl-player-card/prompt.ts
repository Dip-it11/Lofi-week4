/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React component called <VinylCard /> — a lofi music player card styled like a vinyl record in its sleeve.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS.
- It is a client component ("use client"). No UI or audio libraries.

## Look
- A rounded card. At the top is a "stage" (aspect ratio 100:60) holding three layers:
  1. A square record sleeve on the left (56% of the stage width) with a soft drop shadow and a darker inner edge on its right side (the opening).
  2. A vinyl record (94% of the sleeve size) sitting BEHIND the sleeve: near-black disc, fine concentric grooves, darker gaps between tracks, a coloured centre label with the label text running around it on an SVG textPath, and a spindle hole.
  3. A tonearm drawn in SVG on the right: a pivot base, a thin arm and a headshell.
- A static light reflection (conic-gradient) sits over the record and does NOT rotate, like light on a real record.
- If no cover image is passed, generate the sleeve art in SVG: a two-colour sky gradient, a few stars, a retro striped sun, two layered hill silhouettes, a faint "ring wear" circle, a subtle film-grain filter (feTurbulence), and the title + artist printed in the top-left corner.
- Below the stage: a round play/pause button, the title and artist (truncated), a 4-bar equaliser, then a seek bar with elapsed and total time.
- An optional badge renders as a slightly rotated record-shop sticker on the sleeve.

## Motion
- Hover or keyboard focus inside the card: the record slides 24% of its width out of the sleeve, and the sleeve lifts and tilts by 1°.
- Play: the record slides 70% out (so the label is visible) and spins (CSS keyframes, ~1.8s per turn). The tonearm rotates around its pivot onto the grooves, with a short delay. The equaliser bars animate.
- Pause: use animation-play-state so the record stops where it is instead of snapping back, then it slides home.
- prefers-reduced-motion: no spinning record and no equaliser animation.

## Audio
- src?: play a real audio file with an <audio> element (timeupdate → position, loadedmetadata → duration, waiting → loading spinner, ended → reset).
- demoSound?: with no src, generate a lofi beat live with the Web Audio API: ii–V–I–vi jazz chords (Dm9, G13, Cmaj9, Am9) at ~74 BPM on a soft electric-piano voice (sine + quiet triangle/sine harmonics), a swung kick / snare / hi-hat kit made from oscillators and filtered noise, a warm low-pass filter, slow tape wobble on the pitch, and a looping vinyl-crackle buffer. Use a look-ahead scheduler (setInterval 25ms, schedule ~150ms ahead). Fade in on play, fade out and suspend the AudioContext on pause, close it on unmount.
- With neither, run a timed preview so the progress bar still moves for "duration" seconds.
- Only one card plays at a time: broadcast a window CustomEvent when a card starts, and every other card pauses.

## Props (typed with TypeScript)
- title: string, artist: string (required)
- coverImage?: string, coverAlt?: string
- palette?: Partial<{ sky: [string, string]; sun; land; label; accent }> — default Lofistack purple (#351367) with a peach sun
- src?: string, demoSound?: boolean, duration?: number = 180
- badge?: string, labelText?: string (defaults to the artist)
- tone?: "light" | "dark", disabled?: boolean, loading?: boolean
- onPlay?, onPause?, onEnded?: () => void, className?: string
- Never hardcode values that should come from props.

## States & accessibility
- The card is an <article> labelled "<title> by <artist>"; data-state reflects idle / playing / loading / disabled.
- Play button: 48px, aria-pressed, aria-label "Play <title>" / "Pause <title>", with hover (scale + brighten), focus-visible ring, active press, a loading spinner, and a disabled style.
- Seek bar: a native range input with aria-label and aria-valuetext ("1:23 of 3:30"), a filled track in the accent colour, a styled thumb, and focus and disabled states.
- Disabled cards are dimmed and can't be played or scrubbed.
- Fully responsive: everything is sized in percentages of the card, so it works from ~280px wide up.

## Deliverables
- src/components/vinyl-card/VinylCard.tsx (component, cover art, record, tonearm, playback)
- src/components/vinyl-card/lofiSynth.ts (the Web Audio beat generator)
- src/components/vinyl-card/index.ts (exports)
- A usage example:
  <VinylCard title="Midnight Commit" artist="Lofistack" demoSound duration={96} badge="Sound on" />`;
