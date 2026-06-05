import {
  Activity,
  Calendar,
  CalendarCheck,
  LayoutGrid,
  Plus,
  Settings,
  User,
} from "lucide-react";
import type { ComponentType } from "react";

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
    id: "today",
    icon: CalendarCheck,
    label: "Today",
    ariaLabel: "Go to today",
    to: "/today",
  },
  {
    id: "calendar",
    icon: Calendar,
    label: "Calendar",
    ariaLabel: "Go to calendar",
    to: "/calendar",
  },
  {
    id: "library",
    icon: LayoutGrid,
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
    to: "/settings",
  },
];
