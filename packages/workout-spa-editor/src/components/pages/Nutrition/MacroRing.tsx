import type { MacroRing as MacroRingModel } from "./macro-rings-view-model";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TRACK_COLOR = "var(--ring-track)";

const RING_COLOR: Record<MacroRingModel["key"], string> = {
  energy: "#f97316",
  protein: "#38bdf8",
  carb: "#a3e635",
  fat: "#f472b6",
};

export type MacroRingProps = { ring: MacroRingModel; size?: number };

/**
 * One macro progress ring: an SVG arc whose sweep is the clamped target
 * fraction, with the actual figure centered. A null fraction (no target)
 * renders just the track with the raw value.
 */
export function MacroRing({ ring, size = 56 }: MacroRingProps) {
  const fraction = ring.fraction ?? 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const stroke = ring.over ? "#fbbf24" : RING_COLOR[ring.key];
  return (
    <div
      className="flex flex-col items-center gap-1"
      data-testid={`macro-ring-${ring.key}`}
    >
      <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          stroke={TRACK_COLOR}
          strokeWidth="4"
        />
        {ring.fraction !== null && (
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 22 22)"
          />
        )}
        <text
          x="22"
          y="25"
          textAnchor="middle"
          className="fill-ink-strong text-[9px] font-bold"
        >
          {Math.round(ring.actual)}
        </text>
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        {ring.label}
      </span>
    </div>
  );
}
