import {
  Activity,
  Calendar,
  Library,
  Plus,
  Settings,
  User,
} from "lucide-react";
import type { ComponentType } from "react";

import { getCurrentWeekId } from "../../../utils/week-utils";

export type EntryDef = {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  ariaLabel?: string;
  to: string;
  variant?: "primary" | "tertiary";
};

export const ENTRY_DEFS: ReadonlyArray<EntryDef> = [
  {
    id: "calendar",
    icon: Calendar,
    label: "Calendar",
    ariaLabel: "Go to calendar",
    to: "/calendar",
  },
  {
    id: "library",
    icon: Library,
    label: "Library",
    ariaLabel: "Open workout library",
    to: "/library",
  },
  {
    id: "athlete",
    icon: User,
    label: "Athlete",
    ariaLabel: "Open athlete profile",
    to: "/athlete",
  },
  {
    id: "trends",
    icon: Activity,
    label: "Trends",
    ariaLabel: "Open wellness trends",
    to: "/health",
  },
  {
    id: "new",
    icon: Plus,
    label: "New workout",
    to: "/workout/new",
    variant: "primary",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    ariaLabel: "Open settings",
    to: "/settings/ai",
  },
];

/** Resolves an entry's navigation target. The bare `/calendar` route now
    renders the Today page, so the Calendar entry points at the current
    week (`/calendar/:weekId`) — otherwise the week calendar would only be
    reachable by deep-link. */
export function resolveEntryHref(entry: EntryDef): string {
  return entry.id === "calendar" ? `/calendar/${getCurrentWeekId()}` : entry.to;
}

/** Derives whether a header entry is active for the current location.
    Mirrors the bottom-nav `isTabActive` predicate: calendar matches the
    Today summary, the index route, and any `/calendar/:weekId` week grid;
    settings matches any `/settings`-prefixed path; others match by prefix
    of the entry's base target so sub-routes still highlight their parent. */
export function isEntryActive(entry: EntryDef, location: string): boolean {
  if (entry.id === "calendar") {
    return (
      location === "/calendar" ||
      location === "/" ||
      location.startsWith("/calendar/")
    );
  }
  if (entry.id === "settings") {
    return location === "/settings" || location.startsWith("/settings/");
  }
  return location === entry.to || location.startsWith(`${entry.to}/`);
}
