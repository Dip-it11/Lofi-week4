import { memo } from "react";
import type { ArtPart } from "./catArt";

/**
 * Cut-out rig for the hand-drawn black cat.
 *
 * Source art faces LEFT in artboard units (y down). Every rig transform below
 * is in those units; the parent mirrors and scales the cat into place.
 * Pivots were picked by hand from the artwork (shoulders, hips, tail root, neck).
 */

export type CatPalette = {
  /** Main body fill. */
  fill: string;
  /** Shading shapes. */
  shade: string;
  /** Ink outlines and features. */
  line: string;
  /** Fur hatching highlights. */
  fur: string;
};

export const DEFAULT_CAT_PALETTE: CatPalette = {
  fill: "#39414c",
  shade: "#2b3139",
  line: "#160217",
  fur: "#707984",
};

type Art = {
  WALKER: Record<"tail" | "farFront" | "farHind" | "body" | "head" | "nearFront", ArtPart>;
  SITTER: Record<"tail" | "body", ArtPart>;
};

/** Ground contact under the front paws — the shared origin of both poses. */
export const WALKER_ORIGIN = { x: 105, y: 460 } as const;
export const SITTER_ORIGIN = { x: 330, y: 462 } as const;
/** Horizontal extents relative to the origin, mirrored (+ = forward). */
export const WALKER_EXTENT = { back: -206, front: 54, height: 228 } as const;
export const SITTER_EXTENT = { back: -165, front: 22, height: 210 } as const;

/** Gait: body travel (artboard units) per full stride cycle. */
export const STRIDE_DISTANCE = 140;

const PIVOTS = {
  tail: [243, 346],
  farFront: [100, 368],
  nearFront: [112, 386],
  farHind: [238, 368],
  nearHind: [210, 413],
  neck: [100, 352],
} as const;

/** Lateral-sequence walk: phase offsets and swing amplitudes (degrees). */
const LEGS = {
  farHind: { off: 0.5, amp: 15 },
  farFront: { off: 0.75, amp: 18 },
  nearHind: { off: 0, amp: 13 },
  nearFront: { off: 0.25, amp: 18 },
} as const;

// Splits the body shape at the near hind leg's knee so the lower leg can swing.
const NEAR_HIND_CLIP = "M186 421 L232 404 L262 404 L262 476 L158 476 L158 430 Z";
const NEAR_HIND_JOINT = { cx: 210, cy: 413, r: 15 };
const BODY_CLIP = "M0 0 L600 0 L600 600 L0 600 Z M186 421 L158 430 L158 476 L262 476 L262 404 L232 404 Z";

const TAU = Math.PI * 2;

function Part({ part, palette }: { part: ArtPart; palette: CatPalette }) {
  const tones = [palette.fill, palette.shade, palette.line, palette.fur];
  return (
    <g transform="scale(0.1)">
      {part.map(([tone, d], i) => (
        <path key={i} d={d} fill={tones[tone]} />
      ))}
    </g>
  );
}

const MemoPart = memo(Part);

function legTransform(leg: keyof typeof LEGS, pivot: readonly [number, number], phase: number, amount: number) {
  const { off, amp } = LEGS[leg];
  const a = TAU * (phase + off);
  // Relative to the drawn pose so amount = 0 lands exactly on the artwork.
  const r = amp * amount * (Math.sin(a) - Math.sin(TAU * off));
  // Shorten the leg a touch while it swings forward (paw lifts off the ground).
  const lift = 1 - 0.09 * amount * Math.max(0, Math.cos(a)) ** 1.5;
  const [px, py] = pivot;
  return `rotate(${r.toFixed(2)} ${px} ${py}) translate(${px} ${py}) scale(1 ${lift.toFixed(3)}) translate(${-px} ${-py})`;
}

export type WalkerProps = {
  art: Art;
  palette: CatPalette;
  /** Gait phase in cycles (distance / STRIDE_DISTANCE). */
  phase: number;
  /** 0..1 — how much of the walk cycle is applied (0 = the drawn pose). */
  amount: number;
  /** Seconds, for idle motion. */
  time: number;
  /** Unique id prefix for clip paths. */
  uid: string;
};

export function Walker({ art, palette, phase, amount, time, uid }: WalkerProps) {
  const W = art.WALKER;
  const bob = -1.8 * amount * Math.sin(TAU * 2 * phase);
  const head = 1.6 * amount * Math.sin(TAU * 2 * phase + 0.9) + 0.6 * Math.sin(time * 1.7);
  const tail = 6 * amount * Math.sin(TAU * phase + 1.2) + 3 * Math.sin(time * 2.1);
  const legClip = `${uid}-leg`;
  const bodyClip = `${uid}-body`;

  return (
    <g>
      <defs>
        <clipPath id={legClip}>
          <path d={NEAR_HIND_CLIP} />
          <circle {...NEAR_HIND_JOINT} />
        </clipPath>
        <clipPath id={bodyClip}>
          <path d={BODY_CLIP} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g transform={`translate(0 ${bob.toFixed(2)})`}>
        <g transform={`rotate(${tail.toFixed(2)} ${PIVOTS.tail[0]} ${PIVOTS.tail[1]})`}>
          <MemoPart part={W.tail} palette={palette} />
        </g>
        <g transform={legTransform("farFront", PIVOTS.farFront, phase, amount)}>
          <MemoPart part={W.farFront} palette={palette} />
        </g>
        <g transform={legTransform("farHind", PIVOTS.farHind, phase, amount)}>
          <MemoPart part={W.farHind} palette={palette} />
        </g>
        <g transform={legTransform("nearHind", PIVOTS.nearHind, phase, amount)}>
          <g clipPath={`url(#${legClip})`}>
            <MemoPart part={W.body} palette={palette} />
          </g>
        </g>
        <g clipPath={`url(#${bodyClip})`}>
          <MemoPart part={W.body} palette={palette} />
        </g>
        <g transform={`rotate(${head.toFixed(2)} ${PIVOTS.neck[0]} ${PIVOTS.neck[1]})`}>
          <MemoPart part={W.head} palette={palette} />
        </g>
        <g transform={legTransform("nearFront", PIVOTS.nearFront, phase, amount)}>
          <MemoPart part={W.nearFront} palette={palette} />
        </g>
      </g>
    </g>
  );
}

export function Sitter({ art, palette, animateTail }: { art: Art; palette: CatPalette; animateTail: boolean }) {
  return (
    <g>
      <g className={animateTail ? "crh-tail" : undefined}>
        <MemoPart part={art.SITTER.tail} palette={palette} />
      </g>
      <MemoPart part={art.SITTER.body} palette={palette} />
    </g>
  );
}

export type { Art as CatArt };
