/* Helpers for the 5-zone training ramp. The CSS variables --zone-1..5 (and
   their Tailwind `zone-1..5` color utilities) are the source of truth. The
   literal class array below exists only so Tailwind can statically detect
   every class — a dynamic `bg-zone-${n}` would be purged. Index i maps to
   zone Z(i+1).

   There is deliberately no hex mirror of the ramp. The palette carries a
   separate row per theme, so a frozen copy renders one theme's zones on the
   other, and has to be re-transcribed by hand every time the ramp moves. */

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
  return ZONE_BG_CLASSES[zone - 1]!;
}

/** The zone's role token, for the inline styles utilities cannot express. */
export function zoneVar(zone: ZoneNumber): string {
  return `var(--zone-${zone})`;
}

/** Vertical zone gradient (solid top → 80% alpha bottom) with inset top
    highlight, per the design handoff zone-bar treatment. */
export function zoneGradient(zone: ZoneNumber): {
  background: string;
  boxShadow: string;
} {
  const color = zoneVar(zone);
  return {
    background: `linear-gradient(180deg, ${color}, color-mix(in oklab, ${color} 80%, transparent))`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
  };
}
