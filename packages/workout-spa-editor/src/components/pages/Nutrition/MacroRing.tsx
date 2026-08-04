import { useTranslate } from "../../../i18n/use-translate";
import { ALERT_ICON, Icon } from "../../atoms/Icon";
import type { MacroRing as MacroRingModel } from "./macro-rings-view-model";

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_COLOR = "var(--ink-strong)";
const TRACK_COLOR = "var(--ring-track)";
// The arc is clamped to a full circle, so "at target" and "over target" draw
// the same ring. The over ring sinks its track one lightness step and says so
// in its label — there is no warning role, and amber is zone 4's hue.
const OVER_TRACK_COLOR = "var(--edge-strong)";

export type MacroRingProps = { ring: MacroRingModel; size?: number };

/**
 * One macro progress ring: an SVG arc whose sweep is the clamped target
 * fraction, with the actual figure centered. A null fraction (no target)
 * renders just the track with the raw value. Every macro takes the same ink
 * arc — the ring says how much, the label says which.
 */
export function MacroRing({ ring, size = 56 }: MacroRingProps) {
  const t = useTranslate("nutrition");
  const fraction = ring.fraction ?? 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
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
          stroke={ring.over ? OVER_TRACK_COLOR : TRACK_COLOR}
          strokeWidth="4"
        />
        {ring.fraction !== null && (
          <circle
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            stroke={ARC_COLOR}
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
          className="fill-ink-strong text-[9px] font-semibold tabular-nums"
        >
          {Math.round(ring.actual)}
        </text>
      </svg>
      {ring.over ? (
        <span
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-ink-strong"
          data-testid={`macro-ring-over-${ring.key}`}
        >
          <Icon icon={ALERT_ICON} size="xs" color="inherit" />
          {t("macros.over", { macro: ring.label })}
        </span>
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
          {ring.label}
        </span>
      )}
    </div>
  );
}
