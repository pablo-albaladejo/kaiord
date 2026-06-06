import type { EntryDef } from "./status-entry-defs";

/** Active-state predicate, mirroring the bottom-nav `isTabActive`:
    today ⇔ `/today`; calendar ⇔ index route + `/calendar(/...)` (default
    view); settings ⇔ `/settings(/...)`; others by base-target prefix. */
export function isEntryActive(entry: EntryDef, location: string): boolean {
  if (entry.id === "today") {
    return location === "/today";
  }
  if (entry.id === "calendar") {
    return (
      location === "/" ||
      location === "/calendar" ||
      location.startsWith("/calendar/")
    );
  }
  if (entry.id === "settings") {
    return location === "/settings" || location.startsWith("/settings/");
  }
  return location === entry.to || location.startsWith(`${entry.to}/`);
}
