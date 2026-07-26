import type { CSSProperties } from "react";

/** Exact glass blur from the redesign handoff. */
export const BAR_STYLE: CSSProperties = {
  height: 64,
  backgroundColor: "var(--glass-bg)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "var(--glass-shadow)",
};

/** Raised gradient FAB centered over the bar notch. */
export const FAB_STYLE: CSSProperties = {
  width: 58,
  height: 58,
  background: "linear-gradient(160deg, #38bdf8, #0284c7)",
  boxShadow:
    "0 8px 22px rgba(2,132,199,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
};

/** Width of the central spacer reserved for the FAB notch. */
export const FAB_NOTCH_WIDTH = 58;

export const TAB_ICON_SIZE = 23;
export const FAB_ICON_SIZE = 28;
export const ACTIVE_STROKE_WIDTH = 2.2;
export const INACTIVE_STROKE_WIDTH = 1.9;
