import type { CSSProperties } from "react";

/** Exact glass blur from the redesign handoff. */
export const BAR_STYLE: CSSProperties = {
  height: 64,
  backgroundColor: "var(--glass-bg)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "var(--glass-shadow)",
};

/**
 * Raised FAB centered over the bar notch. Flat `--control`, not the old
 * sky-blue gradient: that hue sat 5° from `--zone-2`, so the create button
 * was painted the colour that means "easy endurance".
 */
export const FAB_STYLE: CSSProperties = {
  width: 58,
  height: 58,
  background: "var(--control)",
  color: "var(--control-ink)",
  boxShadow: "var(--shadow-float)",
};

/** Width of the central spacer reserved for the FAB notch. */
export const FAB_NOTCH_WIDTH = 58;

export const TAB_ICON_SIZE = 23;
export const FAB_ICON_SIZE = 28;
export const ACTIVE_STROKE_WIDTH = 2.2;
export const INACTIVE_STROKE_WIDTH = 1.9;
