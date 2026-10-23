"use client";

import { useTriageText } from "@/lib/hooks";

/**
 * Simple, respectful line illustrations for the self-check and symptom questions.
 * Each has a text alternative; the breast diagram is a pointer shortcut for the
 * answer list beside it, which remains the accessible control.
 */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** One standing figure. `arms` sets the mirror position. */
function Figure({ arms }: { arms: "sides" | "hips" | "raised" }) {
  const armPaths = {
    sides: ["M40 50 L30 118", "M80 50 L90 118"],
    hips: ["M40 50 L22 84 L42 102", "M80 50 L98 84 L78 102"],
    raised: ["M40 50 L30 26 L44 4", "M80 50 L90 26 L76 4"],
  }[arms];
  return (
    <svg viewBox="0 0 120 150" className="h-auto w-full max-w-28" aria-hidden="true" focusable="false">
      <circle cx="60" cy="24" r="12" {...stroke} className="text-brand-600" />
      <path d="M44 44 Q60 38 76 44 L80 132 Q60 140 40 132 Z" {...stroke} className="text-brand-600" fill="#fde9f2" />
      <path d="M46 76 q7 9 13 0 M61 76 q7 9 13 0" {...stroke} strokeWidth={2.5} className="text-brand-700" />
      {armPaths.map((d) => (
        <path key={d} d={d} {...stroke} className="text-brand-600" />
      ))}
    </svg>
  );
}

export function MirrorIllustration() {
  const { text } = useTriageText();
  const captions = text.illustrations.mirrorPositions;
  return (
    <figure className="w-full rounded-3xl border border-line bg-white/80 p-4">
      <div role="img" aria-label={text.illustrations.mirror} className="grid grid-cols-3 gap-2">
        {(["sides", "hips", "raised"] as const).map((arms, index) => (
          <div key={arms} className="flex flex-col items-center gap-1 text-center">
            <Figure arms={arms} />
            <span aria-hidden="true" className="text-sm font-semibold leading-tight text-ink-soft">
              {captions[index]}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function LyingDownIllustration() {
  const { text } = useTriageText();
  return (
    <figure className="w-full rounded-3xl border border-line bg-white/80 p-4">
      <svg viewBox="0 0 320 120" role="img" aria-label={text.illustrations.lyingDown} className="mx-auto h-auto w-full max-w-md">
        <path d="M20 96 H300" {...stroke} strokeWidth={2} className="text-line" />
        <circle cx="62" cy="70" r="13" {...stroke} className="text-brand-600" />
        <path d="M82 60 Q96 54 112 58 L238 64 Q252 72 238 84 L112 90 Q96 92 82 84 Z" {...stroke} fill="#fde9f2" className="text-brand-600" />
        {/* Arm raised over the head. */}
        <path d="M92 58 L60 40 L28 50" {...stroke} className="text-brand-600" />
        {/* Hand pressing with three fingers, and the small circles it makes. */}
        <path d="M132 40 L146 58 M140 36 L152 56 M148 34 L158 54" {...stroke} strokeWidth={2.5} className="text-brand-700" />
        <circle cx="150" cy="66" r="5" {...stroke} strokeWidth={2} className="text-brand-500" />
        <circle cx="166" cy="70" r="5" {...stroke} strokeWidth={2} className="text-brand-500" />
        <circle cx="134" cy="72" r="5" {...stroke} strokeWidth={2} className="text-brand-500" />
      </svg>
    </figure>
  );
}

export function OpeningsIllustration() {
  const { text } = useTriageText();
  const t = text.illustrations;
  const nipple = (dots: [number, number][], highlight: number[]) => (
    <svg viewBox="0 0 100 100" className="size-24" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="44" fill="#fbd3e4" />
      <circle cx="50" cy="50" r="22" fill="#f6a9cc" />
      {dots.map(([x, y], index) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={highlight.includes(index) ? 4 : 2.5} fill={highlight.includes(index) ? "#7d1247" : "#c81e72"} />
      ))}
    </svg>
  );
  const dots: [number, number][] = [
    [50, 42],
    [42, 52],
    [58, 52],
    [50, 60],
    [44, 44],
  ];
  return (
    <figure role="img" aria-label={t.openings} className="flex w-full justify-center gap-8 rounded-3xl border border-line bg-white/80 p-4">
      <div className="flex flex-col items-center gap-1">
        {nipple(dots, [0])}
        <span aria-hidden="true" className="text-sm font-semibold text-ink-soft">
          {t.oneOpening}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1">
        {nipple(dots, [0, 1, 2, 3, 4])}
        <span aria-hidden="true" className="text-sm font-semibold text-ink-soft">
          {t.severalOpenings}
        </span>
      </div>
    </figure>
  );
}

/** Colour samples for the fluid colour question. Decorative: each answer is labelled in words. */
export const FLUID_SWATCHES: Record<string, string[]> = {
  clear: ["#eef6fb"],
  pink: ["#f7b4c6"],
  bloody: ["#a4161a"],
  milky: ["#f6f1e3"],
  coloured: ["#8a9a3b", "#e2c044", "#7a5230"],
};

export function Swatch({ colours }: { colours: string[] }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 -space-x-2">
      {colours.map((colour) => (
        <span key={colour} className="size-7 rounded-full border-2 border-white shadow-soft ring-1 ring-ink/15" style={{ background: colour }} />
      ))}
    </span>
  );
}

type Quadrant = "upperOuter" | "upperInner" | "lowerOuter" | "lowerInner" | "nipple";

// Pie slices around the nipple, drawn as seen when you look down at yourself.
const SLICES = {
  upperRight: "M100 12 A88 88 0 0 1 188 100 L122 100 A22 22 0 0 0 100 78 Z",
  upperLeft: "M12 100 A88 88 0 0 1 100 12 L100 78 A22 22 0 0 0 78 100 Z",
  lowerRight: "M188 100 A88 88 0 0 1 100 188 L100 122 A22 22 0 0 0 122 100 Z",
  lowerLeft: "M100 188 A88 88 0 0 1 12 100 L78 100 A22 22 0 0 0 100 122 Z",
};

/**
 * The breast divided into four areas, mirrored so "outer" is always on the armpit side:
 * on the right breast the armpit is on the right of the picture, on the left breast on the left.
 */
export function BreastDiagram({
  side,
  value,
  onSelect,
}: {
  side: "right" | "left";
  value: string | undefined;
  onSelect: (quadrant: Quadrant) => void;
}) {
  const { text } = useTriageText();
  const t = text.illustrations;
  const outerOnRight = side === "right";
  const regions: [Quadrant, string][] = [
    ["upperOuter", outerOnRight ? SLICES.upperRight : SLICES.upperLeft],
    ["upperInner", outerOnRight ? SLICES.upperLeft : SLICES.upperRight],
    ["lowerOuter", outerOnRight ? SLICES.lowerRight : SLICES.lowerLeft],
    ["lowerInner", outerOnRight ? SLICES.lowerLeft : SLICES.lowerRight],
  ];
  const fill = (quadrant: Quadrant) => (value === quadrant ? "fill-brand-300" : "fill-brand-50 hover:fill-brand-100");

  return (
    <figure className="flex w-full flex-col items-center gap-2 rounded-3xl border border-line bg-white/80 p-4">
      <figcaption className="sr-only">{t.breastDiagram(side === "right" ? t.right : t.left)}</figcaption>
      <div className={`flex w-full max-w-xs justify-between text-sm font-semibold text-ink-soft ${outerOnRight ? "" : "flex-row-reverse"}`}>
        <span>{t.middleSide}</span>
        <span>{t.armpitSide}</span>
      </div>
      <svg viewBox="0 0 200 200" className="size-56 max-w-full" aria-hidden="true" focusable="false">
        {regions.map(([quadrant, d]) => (
          <path
            key={quadrant}
            d={d}
            onClick={() => onSelect(quadrant)}
            className={`cursor-pointer stroke-brand-400 transition-colors ${fill(quadrant)}`}
            strokeWidth={2}
          />
        ))}
        <circle
          cx="100"
          cy="100"
          r="22"
          onClick={() => onSelect("nipple")}
          className={`cursor-pointer stroke-brand-500 transition-colors ${value === "nipple" ? "fill-brand-400" : "fill-brand-200 hover:fill-brand-300"}`}
          strokeWidth={2}
        />
      </svg>
    </figure>
  );
}
