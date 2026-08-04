/**
 * The Kaiord mark, inlined.
 *
 * It has to be inline: an SVG behind `<img src>` is an isolated document that
 * inherits neither `currentColor` nor `--core-live`, so a referenced mark
 * would render black in both themes and never take the live core.
 *
 * `core="live"` is the app-header form. Its centre reads `--core-live`, which
 * the runtime sets to the week's dominant training zone on the wrapper; with
 * nothing set — an empty week — the SVG's own fallback renders ink, with no
 * JavaScript involved.
 */

import {
  MARK_CORE_RADIUS,
  MARK_FULL_HUB_MIN_PX,
  MARK_HULL,
  MARK_NODE_RADIUS,
  MARK_NODES,
  MARK_SPOKES,
} from "./mark-geometry";

export type BrandMarkProps = {
  /** Rendered edge length in px. Below 24 the spokes and nodes are dropped. */
  size?: number;
  /** `live` lets the core take `--core-live`; `ink` keeps it on currentColor. */
  core?: "ink" | "live";
  className?: string;
  title?: string;
};

export function BrandMark({
  size = 28,
  core = "ink",
  className,
  title,
}: BrandMarkProps) {
  const full = size >= MARK_FULL_HUB_MIN_PX;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d={MARK_HULL}
        stroke="currentColor"
        strokeWidth={full ? 1.8 : 2.4}
        strokeLinejoin="round"
      />
      {full &&
        MARK_SPOKES.map(([x1, y1, x2, y2]) => (
          <line
            key={`${x1}-${y1}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth={1.4}
          />
        ))}
      {full &&
        MARK_NODES.map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={MARK_NODE_RADIUS}
            fill="currentColor"
          />
        ))}
      <circle
        cx={16}
        cy={16}
        r={full ? MARK_CORE_RADIUS : 4.4}
        fill={
          core === "live" ? "var(--core-live, currentColor)" : "currentColor"
        }
      />
    </svg>
  );
}
