import { ZONE_BG_CLASSES } from "../../../../lib/zone-colors";

/* Soft zone tints for the editor's rows and dots. The hue comes from the one
   ramp (`lib/zone-colors`), never a second palette: this file used to carry a
   seven-hue rainbow of its own, so the zone editor painted zones in colours
   that were not the zones'. The `/15` alpha keeps them readable as a
   background behind text — the classes are spelled out because a computed
   `bg-zone-${n}/15` would be purged. */
const ZONE_TINT_CLASSES = [
  "bg-zone-1/15",
  "bg-zone-2/15",
  "bg-zone-3/15",
  "bg-zone-4/15",
  "bg-zone-5/15",
] as const;

/** Soft background class for a zone number, clamped to the five-zone ramp. */
export function getZoneColor(zoneNumber: number): string {
  const zone = Number.isInteger(zoneNumber)
    ? Math.min(Math.max(zoneNumber, 1), ZONE_BG_CLASSES.length)
    : 1;
  return ZONE_TINT_CLASSES[zone - 1] ?? ZONE_TINT_CLASSES[0];
}
