/**
 * The card's one graphical channel.
 *
 * It carries the session's dominant training zone and nothing else. Lifecycle
 * is a word in a chip, compliance is a percentage, and both are text — colour
 * is spent on the only fact text cannot carry. A session with no classifiable
 * structure keeps the neutral edge, so processing a raw import is literally
 * what gives its card colour.
 *
 * The zone ramp carries a separate row per theme in `styles/brand-tokens.css`,
 * each verified against its own surface, so there is no per-token contrast
 * table to maintain here — a frozen hex mirror would render one theme's zones
 * on the other.
 */

import type { ZoneNumber } from "../../../lib/zone-colors";

/** Literal per zone so Tailwind can see every class it has to emit. */
const ZONE_BORDER_CLASSES = [
  "border-l-zone-1",
  "border-l-zone-2",
  "border-l-zone-3",
  "border-l-zone-4",
  "border-l-zone-5",
] as const;

const NEUTRAL_BORDER_CLASS = "border-l-edge";

/** Left-edge colour for a session's dominant zone; neutral when unknown. */
export const zoneBorderClass = (zone: ZoneNumber | null): string =>
  zone === null ? NEUTRAL_BORDER_CLASS : ZONE_BORDER_CLASSES[zone - 1]!;
