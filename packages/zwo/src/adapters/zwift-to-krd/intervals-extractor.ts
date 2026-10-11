import { XMLParser } from "fast-xml-parser";

type ZwiftWorkout = {
  SteadyState?: unknown;
  Warmup?: unknown;
  Ramp?: unknown;
  Cooldown?: unknown;
  IntervalsT?: unknown;
  FreeRide?: unknown;
};

type IntervalData = { type: string; data: Record<string, unknown> };
type OrderedNode = Record<string, unknown>;

const INTERVAL_TYPES = [
  "SteadyState",
  "Warmup",
  "Ramp",
  "Cooldown",
  "IntervalsT",
  "FreeRide",
];

const childrenOf = (nodes: Array<OrderedNode>, tag: string) =>
  (nodes.find((node) => tag in node)?.[tag] as Array<OrderedNode>) ?? [];

// The default parse groups siblings by tag name, which loses the interleaving
// of <workout> children; only preserveOrder mode keeps the document order.
export const extractIntervalOrder = (xmlString: string): Array<string> => {
  const document = new XMLParser({ preserveOrder: true }).parse(
    xmlString
  ) as Array<OrderedNode>;
  const workout = childrenOf(childrenOf(document, "workout_file"), "workout");
  return workout.flatMap((node) =>
    Object.keys(node).filter((key) => INTERVAL_TYPES.includes(key))
  );
};

const toArray = (value: unknown): Array<Record<string, unknown>> => {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]) as Array<
    Record<string, unknown>
  >;
};

/**
 * Without `order` (a pre-parsed object carries none) intervals come back
 * grouped by element type.
 */
export const extractIntervals = (
  workout: ZwiftWorkout | undefined,
  order?: Array<string>
): Array<IntervalData> => {
  if (!workout) return [];

  const byType = new Map(
    INTERVAL_TYPES.map((type) => [
      type,
      toArray(workout[type as keyof ZwiftWorkout]),
    ])
  );
  const sequence =
    order ??
    INTERVAL_TYPES.flatMap((type) => byType.get(type)!.map(() => type));
  const cursors = new Map<string, number>();

  return sequence.flatMap((type) => {
    const index = cursors.get(type) ?? 0;
    cursors.set(type, index + 1);
    const data = byType.get(type)?.[index];
    return data === undefined ? [] : [{ type, data }];
  });
};

export const extractTags = (
  tags: { tag?: Array<{ "@_name": string }> | { "@_name": string } } | undefined
): Array<string> => {
  if (!tags || !tags.tag) return [];

  const tagArray = Array.isArray(tags.tag) ? tags.tag : [tags.tag];
  return tagArray.map((t) => t["@_name"]);
};
