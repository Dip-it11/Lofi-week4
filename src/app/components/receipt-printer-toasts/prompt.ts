/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React toast / notification system called <ReceiptPrinter /> where every notification prints out of a little thermal receipt printer.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS v4.
- Client component ("use client"). No UI, animation, toast or audio libraries.

## API
- <ReceiptPrinter> is a provider that wraps the app and renders the printer; any child calls useReceiptPrinter() to get { print, success, error, warning, info, tear, clear }.
- print({ title, type?, message?, items?: { label, value }[], action?: { label, onClick }, duration?, id? }) queues a receipt and returns its id. success/error/warning/info(title, options) are shortcuts. Reusing an id never prints a duplicate.
- Keep the state in a pure reducer: a queue plus the receipts on screen, each with a phase (queued → printing → shown → tearing).

## Look
- A purple printer (#351367) pinned to the bottom corner: a dark paper slot along the top, a status LED (green when ready, amber blinking while printing), the brand name in monospace, a "Printing · 2 queued" status, a "Tear all" button and a sound toggle.
- Receipts stack above the slot on off-white paper (#fbf8f1) with zig-zag torn edges (CSS mask with conic gradients) and a soft drop shadow, in a monospace font.
- Each receipt: a header (brand, #0001 receipt number, time), a dashed rule, a coloured type icon (✓ ✕ ! i) with the title in caps, the message, line items with dotted leaders and bold values, an optional action button, an "AUTO-TEAR" timer bar, and a rubber stamp in the type colour (DONE / VOID / CHECK / NOTE) that thumps on when printing finishes.
- Width: min(21rem, 100% − 1.5rem), so it fits phones without breakpoints.

## Behaviour
- One printer, one receipt at a time: queued receipts wait until the current one finishes.
- Printing: measure the receipt and grow its height from 0 with a steps() easing (one step per printed line) so the paper feeds out of the slot and pushes older receipts up.
- Stack: at most max (3) on screen — the oldest tears off automatically. Older receipts collapse to their title row; hovering or focusing the stack unrolls them all.
- Auto-tear: a CSS animation on the timer bar (scaleX 1 → 0) whose animationend tears the receipt. Pause it (animation-play-state) while the stack is hovered or focused and while the tab is hidden. duration: 0 keeps the receipt until the user tears it. Errors stay at least 8 s.
- Tearing: swipe sideways (pointer drag > 70 px, the paper follows the finger and tilts), the ✂ button or Escape. The paper flies off rotated, then the gap closes. The action button runs its callback and tears the receipt.
- The printer slides out of view when idle (alwaysShow keeps it). contained positions it inside the nearest positioned parent instead of the window.
- Optional Web Audio sounds (off by default): motor hum + fast print-head ticks while printing, a status beep (two low beeps for errors), and a paper rip when tearing.

## Accessibility
- The stack is a <section aria-label="Notifications">; two persistent visually-hidden live regions announce the newest receipt (polite) or error (assertive), so nothing steals focus.
- Every button has a label ("Tear off: Payment received"), focus-visible rings, and toasts never auto-dismiss while focused or hovered.
- If a focused button disappears, re-check focus so timers don't stay paused.
- prefers-reduced-motion: no feeding animation, fly-off or stamp thump — receipts appear and disappear instantly.

## Props (typed)
children, position "bottom-right" | "bottom-left" | "bottom-center", contained = false, alwaysShow = false, max = 3, duration = 5000, brand = "LOFISTACK", defaultSound = false, palette { body, paper, ink, accent }, className.

## Files
- src/components/receipt-printer-toasts/ReceiptPrinter.tsx
- src/components/receipt-printer-toasts/printerSound.ts
- src/components/receipt-printer-toasts/index.ts`;
