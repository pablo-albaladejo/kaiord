/**
 * The one "this needs you" glyph.
 *
 * The palette has no warning role and no success role, so a state that needs
 * the user is said with this icon plus a phrase naming the state — never with
 * a tint (amber is zone 4's hue, red is zone 5's). See the branding
 * capability's data-series colour policy.
 *
 * It sits beside `ICON_MAP` rather than inside it, the way `SPORT_ICON_NAME`
 * does: `icon-map.ts` is at its 80-line cap, and this glyph is referenced
 * directly rather than by a name threaded through the `IconName` union.
 */
import { TriangleAlert } from "lucide-react";

export const ALERT_ICON = TriangleAlert;
