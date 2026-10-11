import type { IconName } from "../../components/atoms/Icon";
import type { Translate } from "../../i18n/use-translate";

/** Sports the Athlete page lets you switch between. Mirrors the redesign's
    sport selector (the domain `generic` sport is not athlete-selectable). */
export type ActiveSport = "cycling" | "running" | "swimming";

export type AthleteSportOption = {
  value: ActiveSport;
  label: string;
  icon: IconName;
};

export const ATHLETE_SPORTS: readonly Omit<AthleteSportOption, "label">[] = [
  { value: "cycling", icon: "bike" },
  { value: "running", icon: "run" },
  { value: "swimming", icon: "swim" },
];

/** The sport options named in the active locale (`t` is the athlete namespace). */
export const athleteSportOptions = (t: Translate): AthleteSportOption[] =>
  ATHLETE_SPORTS.map((s) => ({ ...s, label: t(`sports.${s.value}`) }));

/** Type guard for persisted/route values that may not be an ActiveSport. */
export function isActiveSport(value: unknown): value is ActiveSport {
  return value === "cycling" || value === "running" || value === "swimming";
}
