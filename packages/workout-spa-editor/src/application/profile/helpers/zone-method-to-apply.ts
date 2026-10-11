import {
  findMethod,
  getDefaultMethodId,
  getMethodsForType,
} from "../../../lib/zone-methods";

type ZoneTable = { method: string; zones: ReadonlyArray<object> };

const isBlank = (zones: ReadonlyArray<object>): boolean =>
  zones.every((zone) =>
    Object.entries(zone).every(
      ([key, value]) => key === "zone" || typeof value !== "number" || !value
    )
  );

/** The preset equal to the model the athlete page draws for a metric. Only
    heart rate has one (Karvonen 5-zone is `HR_MODEL`); pace and power maps
    match no preset, so a blank table of theirs stays blank. */
const PAGE_MODEL_METHOD: Partial<Record<"hr" | "power" | "pace", string>> = {
  hr: "karvonen-5",
};

/** The method a threshold change applies, or null when the table is the
    athlete's own (typed by hand, merged from a coach, or imported). A custom
    table nobody filled in is not a choice, so it takes the page's model. */
export const methodToApply = (
  type: "hr" | "power" | "pace",
  table: ZoneTable | undefined
): string | null => {
  const method = table?.method ?? getDefaultMethodId(type);
  if (method === "custom") {
    if (!table || !isBlank(table.zones)) return null;
    return PAGE_MODEL_METHOD[type] ?? null;
  }
  return findMethod(getMethodsForType(type), method) ? method : null;
};
