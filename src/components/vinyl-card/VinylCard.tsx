"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createLofiSynth, type LofiSynth } from "./lofiSynth";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type VinylPalette = {
  /** Sleeve gradient, top → bottom. */
  sky: [string, string];
  /** The sun on the generated cover. */
  sun: string;
  /** Hills / skyline silhouette on the generated cover. */
  land: string;
  /** Record label colour. */
  label: string;
  /** Play button, progress and focus colour. */
  accent: string;
};

export type VinylCardProps = {
  /** Track title. */
  title: string;
  /** Artist or collection name. */
  artist: string;
  /** Optional cover image URL. When omitted, a lofi sunset cover is generated from `palette`. */
  coverImage?: string;
  /** Alt text for `coverImage`. */
  coverAlt?: string;
  /** Colours for the generated cover, label and controls. */
  palette?: Partial<VinylPalette>;
  /** Audio file to play. Without it the card runs a timed preview (or the demo synth). */
  src?: string;
  /** Play a generated lofi beat when there is no `src` (Web Audio, no files). */
  demoSound?: boolean;
  /** Track length in seconds, used when there is no `src`. */
  duration?: number;
  /** Small pill in the corner, e.g. "New" or "Coming soon". */
  badge?: string;
  /** Text printed around the record label (defaults to the artist). */
  labelText?: string;
  /** Card surface. */
  tone?: "light" | "dark";
  disabled?: boolean;
  /** Force the loading state (e.g. while you fetch a track URL). */
  loading?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PALETTE: VinylPalette = {
  sky: ["#351367", "#c86b98"],
  sun: "#ffc37a",
  land: "#1f0a3d",
  label: "#ffc37a",
  accent: "#351367",
};

const PLAY_EVENT = "vinylcard:play";

const fmt = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

function GeneratedCover({ title, artist, palette, uid }: { title: string; artist: string; palette: VinylPalette; uid: string }) {
  const sky = `${uid}-sky`;
  const sunMask = `${uid}-sun`;
  const grain = `${uid}-grain`;
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.sky[0]} />
          <stop offset="1" stopColor={palette.sky[1]} />
        </linearGradient>
        <mask id={sunMask}>
          <rect width="100" height="100" fill="#fff" />
          {/* retro sun stripes */}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="0" y={60 + i * 4.2} width="100" height={0.9 + i * 0.45} fill="#000" />
          ))}
        </mask>
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={`url(#${sky})`} />
      {[
        [14, 18],
        [27, 9],
        [72, 14],
        [86, 26],
        [58, 7],
        [40, 22],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 0.45 : 0.7} fill="#fff" opacity="0.7" />
      ))}
      <circle cx="50" cy="62" r="23" fill={palette.sun} mask={`url(#${sunMask})`} />
      <path d="M0 74 C14 66 24 70 34 73 C46 77 56 66 70 69 C82 71 90 68 100 64 L100 100 L0 100 Z" fill={palette.land} opacity="0.85" />
      <path d="M0 84 C18 78 30 83 46 82 C62 81 74 76 100 80 L100 100 L0 100 Z" fill={palette.land} />
      {/* ring wear */}
      <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1.2" />
      <rect width="100" height="100" filter={`url(#${grain})`} opacity="0.13" />
      <text x="7" y="13" fill="#fff" fontSize="9" letterSpacing="0.6" style={{ fontFamily: 'var(--font-display, "Bebas Neue"), Impact, sans-serif' }}>
        {title.toUpperCase()}
      </text>
      <text x="7" y="19.5" fill="#fff" fillOpacity="0.75" fontSize="3.6" letterSpacing="0.5" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        {artist.toUpperCase()}
      </text>
    </svg>
  );
}

function Record({ label, labelText, uid }: { label: string; labelText: string; uid: string }) {
  const arc = `${uid}-arc`;
  const text = `${labelText.toUpperCase()} • ${labelText.toUpperCase()} • `;
  return (
    <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true">
      <defs>
        <path id={arc} d="M100 100 m-24 0 a24 24 0 1 1 48 0 a24 24 0 1 1 -48 0" />
      </defs>
      <circle cx="100" cy="100" r="100" fill="#0d0a13" />
      {Array.from({ length: 19 }, (_, i) => 40 + i * 3.1).map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#fff" strokeOpacity="0.045" strokeWidth="0.7" />
      ))}
      {/* gaps between tracks */}
      {[55, 71, 86].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#000" strokeWidth="1.8" />
      ))}
      <circle cx="100" cy="100" r="97" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="1.2" />
      <circle cx="100" cy="100" r="35" fill={label} />
      <circle cx="100" cy="100" r="31.5" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="0.8" />
      <text fontSize="6.4" letterSpacing="1.4" fill="#1d0f33" fillOpacity="0.85" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif", fontWeight: 700 }}>
        <textPath href={`#${arc}`} startOffset="0">
          {text}
        </textPath>
      </text>
      <circle cx="100" cy="100" r="4" fill="var(--vc-surface)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function VinylCard({
  title,
  artist,
  coverImage,
  coverAlt = "",
  palette: paletteOverrides,
  src,
  demoSound = false,
  duration: durationProp = 180,
  badge,
  labelText,
  tone = "light",
  disabled = false,
  loading: loadingProp = false,
  onPlay,
  onPause,
  onEnded,
  className = "",
}: VinylCardProps) {
  const palette = { ...DEFAULT_PALETTE, ...paletteOverrides };
  const uid = `vc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const reduced = usePrefersReducedMotion();

  const audioRef = useRef<HTMLAudioElement>(null);
  const synthRef = useRef<LofiSynth | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationProp);
  const [buffering, setBuffering] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const loading = loadingProp || buffering;

  const callbacks = useRef({ onPlay, onPause, onEnded });
  useEffect(() => {
    callbacks.current = { onPlay, onPause, onEnded };
  }, [onPlay, onPause, onEnded]);

  const pause = useCallback(() => {
    setPlaying(false);
    audioRef.current?.pause();
    void synthRef.current?.pause();
    callbacks.current.onPause?.();
  }, []);

  const play = useCallback(async () => {
    if (disabled || loadingProp) return;
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: uid }));
    setPlaying(true);
    setHasPlayed(true);
    callbacks.current.onPlay?.();
    if (src && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch {
        setPlaying(false);
      }
    } else if (demoSound) {
      synthRef.current ??= createLofiSynth();
      await synthRef.current?.play();
    }
  }, [disabled, loadingProp, src, demoSound, uid]);

  // Only one card plays at a time.
  useEffect(() => {
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== uid) pause();
    };
    window.addEventListener(PLAY_EVENT, onOther);
    return () => window.removeEventListener(PLAY_EVENT, onOther);
  }, [uid, pause]);

  // Without a real audio file, advance a clock while "playing".
  const posRef = useRef(0);
  useEffect(() => {
    if (!playing || src) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let next = posRef.current + dt;
      if (next >= durationProp) {
        if (demoSound) {
          next -= durationProp; // the beat loops
        } else {
          posRef.current = 0;
          setPosition(0);
          pause();
          callbacks.current.onEnded?.();
          return;
        }
      }
      posRef.current = next;
      setPosition(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, src, durationProp, demoSound, pause]);

  useEffect(() => () => synthRef.current?.dispose(), []);

  const seek = (value: number) => {
    posRef.current = value;
    setPosition(value);
    if (src && audioRef.current) audioRef.current.currentTime = value;
  };

  const total = src ? duration : durationProp;
  const pct = total ? Math.min(100, (position / total) * 100) : 0;
  const dark = tone === "dark";

  const style = {
    "--vc-accent": palette.accent,
    "--vc-surface": dark ? "#140b24" : "#ffffff",
  } as CSSProperties;

  // Record travel, as a fraction of its own width.
  const recordClass = playing ? "translate-x-[70%]" : "translate-x-0 group-hover/vc:translate-x-[24%] group-focus-within/vc:translate-x-[24%]";
  const armAngle = playing ? -34.9 : 0;

  return (
    <article
      style={style}
      aria-label={`${title} by ${artist}`}
      data-state={disabled ? "disabled" : loading ? "loading" : playing ? "playing" : "idle"}
      className={`group/vc @container relative w-full max-w-sm rounded-3xl border p-4 transition-shadow duration-300 sm:p-5 ${
        dark ? "border-white/10 bg-[#140b24] text-white" : "border-[#e6e0f2] bg-white text-[#1d1430]"
      } ${disabled ? "opacity-60" : "hover:shadow-xl"} ${playing ? "shadow-xl" : "shadow-sm"} ${className}`}
    >
      {/* Stage: sleeve, record and tonearm */}
      <div className="relative aspect-[100/60] w-full select-none">
        {/* Record (behind the sleeve) */}
        <div
          className={`absolute top-[2.7%] left-[2%] aspect-square w-[52.6%] transition-transform ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
            playing ? "duration-700" : "duration-500"
          } ${disabled ? "" : recordClass}`}
        >
          <div
            className="vc-spin h-full w-full rounded-full shadow-[0_6px_18px_rgba(0,0,0,.35)]"
            style={{ animationPlayState: playing && !reduced ? "running" : "paused" }}
          >
            <Record label={palette.label} labelText={labelText ?? artist} uid={uid} />
          </div>
          {/* Static reflection — doesn't spin, like light on a real record */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 25deg, transparent 0 8%, rgba(255,255,255,.13) 12%, transparent 17% 58%, rgba(255,255,255,.08) 62%, transparent 67%)",
            }}
          />
        </div>

        {/* Sleeve */}
        <div
          className={`absolute top-0 left-0 z-10 aspect-square w-[56%] overflow-hidden rounded-md shadow-[0_10px_24px_-8px_rgba(20,8,40,.45)] transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
            disabled ? "" : "group-hover/vc:-translate-y-0.5 group-hover/vc:-rotate-1"
          }`}
        >
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt={coverAlt} className="h-full w-full object-cover" />
          ) : (
            <GeneratedCover title={title} artist={artist} palette={palette} uid={uid} />
          )}
          {/* Record-shop sticker */}
          {badge && (
            <span className="absolute right-[6%] bottom-[6%] -rotate-6 rounded-md bg-[#fff6d6] px-2 py-1 text-[10px] leading-none font-bold tracking-wide text-[#3a2a12] uppercase shadow-[0_2px_6px_rgba(0,0,0,.25)] @xs:text-[11px]">
              {badge}
            </span>
          )}
          {/* opening edge shading */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[7%] bg-gradient-to-l from-black/25 to-transparent" />
        </div>

        {/* Tonearm */}
        <svg viewBox="0 0 100 60" className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden="true">
          <g
            style={{
              transform: `rotate(${armAngle}deg)`,
              transformOrigin: "95px 52px",
              transformBox: "view-box",
              transition: reduced ? "none" : `transform ${playing ? "0.9s 0.35s" : "0.5s"} cubic-bezier(.3,.7,.2,1)`,
            }}
          >
            <rect x="94.1" y="53.5" width="1.8" height="4.2" rx="0.6" fill={dark ? "#4b3a66" : "#b9aed0"} />
            <line x1="95" y1="52" x2="95.6" y2="32.2" stroke={dark ? "#cfc2ea" : "#8d80a8"} strokeWidth="1" strokeLinecap="round" />
            <rect x="94.4" y="28.4" width="2.4" height="4" rx="0.5" fill={dark ? "#e9e0ff" : "#5d5275"} transform="rotate(-8 95.6 30.4)" />
          </g>
          <circle cx="95" cy="52" r="3.3" fill={dark ? "#2a1a44" : "#efe9fb"} stroke={dark ? "#4b3a66" : "#cbbfe3"} strokeWidth="0.6" />
          <circle cx="95" cy="52" r="1.2" fill={dark ? "#cfc2ea" : "#8d80a8"} />
        </svg>
      </div>

      {/* Meta + controls */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (playing ? pause() : void play())}
          disabled={disabled || loadingProp}
          aria-pressed={playing}
          aria-label={`${playing ? "Pause" : "Play"} ${title}`}
          className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--vc-accent)] text-white shadow-md transition hover:scale-105 hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--vc-accent)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:brightness-100 motion-reduce:transition-none"
        >
          {loading ? (
            <svg viewBox="0 0 24 24" className="size-5 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
            </svg>
          ) : playing ? (
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1.2" />
              <rect x="14" y="5" width="4" height="14" rx="1.2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base leading-tight font-semibold">{title}</h3>
          <p className={`truncate text-sm ${dark ? "text-white/65" : "text-[#5d5275]"}`}>{artist}</p>
        </div>
        {/* Equaliser */}
        <div aria-hidden="true" className="flex h-5 items-end gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full bg-[var(--vc-accent)] transition-opacity ${playing && !reduced ? "vc-eq" : ""}`}
              style={{
                height: playing ? (reduced ? `${[60, 100, 45, 80][i]}%` : undefined) : `${[30, 50, 25, 40][i]}%`,
                opacity: playing ? 1 : 0.35,
                animationDelay: `${i * -0.27}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs tabular-nums">
        <span className={dark ? "text-white/65" : "text-[#5d5275]"}>{fmt(position)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(1, total)}
          step={0.1}
          value={position}
          disabled={disabled || (!hasPlayed && !src)}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label={`Seek ${title}`}
          aria-valuetext={`${fmt(position)} of ${fmt(total)}`}
          className="vc-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--vc-accent) ${pct}%, ${dark ? "rgba(255,255,255,.15)" : "#e6e0f2"} ${pct}%)`,
          }}
        />
        <span className={dark ? "text-white/65" : "text-[#5d5275]"}>{fmt(total)}</span>
      </div>

      {src && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || durationProp)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onEnded={() => {
            setPlaying(false);
            setPosition(0);
            callbacks.current.onEnded?.();
          }}
        />
      )}

      <style>{`
        @keyframes vc-spin { to { transform: rotate(360deg) } }
        .vc-spin { animation: vc-spin 1.8s linear infinite; }
        @keyframes vc-eq { 0%,100% { height: 25% } 30% { height: 100% } 60% { height: 45% } 80% { height: 80% } }
        .vc-eq { animation: vc-eq 0.9s ease-in-out infinite; height: 25%; }
        .vc-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 9999px; background: var(--vc-accent); border: 2px solid var(--vc-surface); box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .15s; }
        .vc-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 9999px; background: var(--vc-accent); border: 2px solid var(--vc-surface); }
        .vc-range:hover:not(:disabled)::-webkit-slider-thumb { transform: scale(1.2); }
        .vc-range:focus-visible { outline: 2px solid var(--vc-accent); outline-offset: 4px; }
        .vc-range:disabled::-webkit-slider-thumb { opacity: .5; }
        @media (prefers-reduced-motion: reduce) { .vc-spin, .vc-eq { animation: none } }
      `}</style>
    </article>
  );
}

export default VinylCard;
