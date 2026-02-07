type ZwiftWorkout = {
  SteadyState?: unknown;
  Warmup?: unknown;
  Ramp?: unknown;
  Cooldown?: unknown;
  IntervalsT?: unknown;
  FreeRide?: unknown;
};

export const extractIntervals = (
  workout: ZwiftWorkout | undefined
): Array<{ type: string; data: Record<string, unknown> }> => {
  if (!workout) return [];

  const intervals: Array<{ type: string; data: Record<string, unknown> }> = [];
  const intervalTypes = [
    "SteadyState",
    "Warmup",
    "Ramp",
    "Cooldown",
    "IntervalsT",
    "FreeRide",
  ];

  for (const type of intervalTypes) {
    const data = workout[type as keyof typeof workout];
    if (data) {
      if (Array.isArray(data)) {
        for (const item of data) {
          intervals.push({ type, data: item as Record<string, unknown> });
        }
      } else {
        intervals.push({ type, data: data as Record<string, unknown> });
      }
    }
  }

  return intervals;
};

export const extractTags = (
  tags: { tag?: Array<{ "@_name": string }> | { "@_name": string } } | undefined
): Array<string> => {
  if (!tags || !tags.tag) return [];

  const tagArray = Array.isArray(tags.tag) ? tags.tag : [tags.tag];
  return tagArray.map((t) => t["@_name"]);
};
