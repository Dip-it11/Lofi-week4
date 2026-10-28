/** The prompt that rebuilds this component — shown (and copyable) on the component page. */
export const PROMPT = `Build a reusable React contact form called <TypewriterContactForm /> where the user types onto paper in a typewriter.

## Stack
- Next.js (App Router) + React + TypeScript, styled with Tailwind CSS.
- Client component ("use client"). No form, animation or audio libraries. Typewriter font: Special Elite (exposed as --font-typewriter).

## Look
- A cream sheet of paper (subtle texture) sticking up out of a purple typewriter. The paper's bottom edge disappears behind a black platen roller with chrome knobs.
- On the paper: "To: <recipient>" and today's date, "Dear <recipient>,", then three typed fields — From (name), Reply to (email), Message (5-line textarea) — each with a label on the left and a dotted underline. Character count + "Cmd/Ctrl + Enter to send" at the bottom.
- The machine: a carriage scale with a marker that follows the caret, a brass name plate ("LOFISTACK · MODEL 90"), three rows of round cream keys (QWERTY), a space bar, a speaker (mute) key and a big red "RETURN · SEND ⏎" key that is the submit button.
- Mobile: hide the letter keys; paper and Return key go full width.

## Typing feel
- Use real <input>/<textarea> elements with transparent text (visible caret), and draw the text again in an aria-hidden "ink" layer on top with the same font metrics. Each character gets a stable pseudo-random vertical offset and ink density, and new characters "strike" in (short opacity/position keyframe). Keep the ink layer aligned on scroll.
- The matching key on the machine dips when you press it; Return dips on Enter.
- Enter in a single-line field moves to the next field (like a carriage return) instead of submitting. Cmd/Ctrl+Enter submits.
- Web Audio sounds, no files: a key clack (filtered noise burst + low thump), the bell (2093 Hz + harmonics) on Enter and when the caret nears the end of a line, and a carriage "zip" (sweeping band-pass noise + ratchet clicks) when the letter is sent. Mute toggle.

## Validation & states
- Validate on submit, then live as the user fixes things: name required, valid email, message ≥ minMessageLength (10).
- Errors appear as red rubber stamps slammed onto the line ("REQUIRED", "CHECK EMAIL", "TOO SHORT") with aria-invalid and aria-describedby pointing to the full message. Focus the first invalid field.
- Sending: onSubmit returns a promise — Return key shows a spinner + "Sending…" (aria-busy), fields go read-only, and the keys tap by themselves.
- Error: a double-bordered "NOT SENT · Please try again" stamp on the paper (role="alert") and the key reads "Try again".
- Success: the paper pulls up out of the machine, folds (scaleY) into a cream envelope whose flap closes over a red wax seal, the envelope flies off to the top-right, and a confirmation note rises in with "Write another letter" (resets the form).
- prefers-reduced-motion: no strike, stamp or envelope animations — go straight to the confirmation note.

## Props (typed)
recipient = "Lofistack", onSubmit(data), labels { name, email, message, submit }, placeholders, minMessageLength = 10, defaultSound = true, successTitle, successMessage, fontFamily, palette { body, keys, paper, ink, stamp }, className.

## Files
- src/components/typewriter-form/TypewriterContactForm.tsx
- src/components/typewriter-form/typewriterSound.ts (clack, ding, zip)
- src/components/typewriter-form/index.ts`;
