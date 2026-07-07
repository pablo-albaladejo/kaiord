import type { IconName } from "./icon-map";

/** Maps a sport key to its redesign icon name. */
export const SPORT_ICON_NAME = {
  cycling: "bike",
  running: "run",
  swimming: "swim",
} as const satisfies Record<string, IconName>;
