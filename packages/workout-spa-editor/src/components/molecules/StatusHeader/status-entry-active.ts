import { ATHLETE_PATH, ATHLETES_PATH } from "../../../routing/constants";
import type { EntryDef } from "./status-entry-defs";

/** Active-state predicate, mirroring the bottom-nav `isTabActive`:
    daily ⇔ `/daily`; calendar ⇔ index route + `/calendar(/...)` (default
    view); settings ⇔ `/settings(/...)`; athlete also owns `/athletes`,
    the list of athletes; others by base-target prefix. */
export function isEntryActive(entry: EntryDef, location: string): boolean {
  if (entry.id === "daily") {
    return location === "/daily";
  }
  if (entry.id === "calendar") {
    return (
      location === "/" ||
      location === "/calendar" ||
      location.startsWith("/calendar/")
    );
  }
  if (entry.to === ATHLETE_PATH && location === ATHLETES_PATH) return true;
  if (entry.id === "settings") {
    return location === "/settings" || location.startsWith("/settings/");
  }
  return location === entry.to || location.startsWith(`${entry.to}/`);
}
