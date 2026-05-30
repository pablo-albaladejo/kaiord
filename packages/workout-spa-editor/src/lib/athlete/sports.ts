import type { IconName } from "../../components/atoms/Icon";

/** Sports the Athlete page lets you switch between. Mirrors the redesign's
    sport selector (the domain `generic` sport is not athlete-selectable). */
export type ActiveSport = "cycling" | "running" | "swimming";

export type AthleteSportOption = {
  value: ActiveSport;
  label: string;
  icon: IconName;
};

export const ATHLETE_SPORTS: readonly AthleteSportOption[] = [
  { value: "cycling", label: "Cycling", icon: "bike" },
  { value: "running", label: "Running", icon: "run" },
  { value: "swimming", label: "Swim", icon: "swim" },
];

/** Type guard for persisted/route values that may not be an ActiveSport. */
export function isActiveSport(value: unknown): value is ActiveSport {
  return value === "cycling" || value === "running" || value === "swimming";
}
