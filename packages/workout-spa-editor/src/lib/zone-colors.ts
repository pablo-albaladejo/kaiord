/* Helpers for the 5-zone training ramp. The CSS variables --zone-1..5 (and
   their Tailwind `zone-1..5` color utilities) are the source of truth; the
   literal class arrays below exist so Tailwind can statically detect every
   class (dynamic `bg-zone-${n}` would be purged). ZONE_HEX mirrors the same
   tokens for cases that need a raw color in an inline gradient (zone bars),
   which cannot be expressed with utilities. Index i maps to zone Z(i+1). */

export const ZONE_HEX = [
  "#64748b",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
] as const;

export const ZONE_BG_CLASSES = [
  "bg-zone-1",
  "bg-zone-2",
  "bg-zone-3",
  "bg-zone-4",
  "bg-zone-5",
] as const;

export type ZoneNumber = 1 | 2 | 3 | 4 | 5;

/** Background utility class for a 1-based zone number. */
export function zoneBgClass(zone: ZoneNumber): string {
  return ZONE_BG_CLASSES[zone - 1];
}

/** Raw hex for a 1-based zone number (for inline gradients). */
export function zoneHex(zone: ZoneNumber): string {
  return ZONE_HEX[zone - 1];
}

/** Vertical zone gradient (solid top → 80% alpha bottom) with inset top
    highlight, per the design handoff zone-bar treatment. */
export function zoneGradient(zone: ZoneNumber): {
  background: string;
  boxShadow: string;
} {
  const hex = zoneHex(zone);
  return {
    background: `linear-gradient(180deg, ${hex}, ${hex}cc)`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
  };
}
