import type { LucideIcon } from "lucide-react";
import { Info, TriangleAlert } from "lucide-react";

/* Glyphs for the two things the palette has no colour for. Success and
   warning left the ramp entirely, so a state that needs the user says so with
   an icon and a sentence (design principle 2), and a note that explains
   something is marked rather than tinted.

   They live beside `ICON_MAP` rather than inside it only because that map is
   at its file-size cap; the naming convention is the same. */
export const STATUS_ICON = {
  alert: TriangleAlert,
  info: Info,
} as const satisfies Record<string, LucideIcon>;
