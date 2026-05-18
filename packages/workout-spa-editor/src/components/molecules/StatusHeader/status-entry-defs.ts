import { Calendar, Library, Plus, Settings, User } from "lucide-react";
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
    id: "new",
    icon: Plus,
    label: "New workout",
    to: "/workout/new",
    variant: "primary",
  },
  {
    id: "profile",
    icon: User,
    label: "Profile",
    ariaLabel: "Open profile manager",
    to: "/settings/profile",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    ariaLabel: "Open settings",
    to: "/settings/ai",
  },
];
