import type { Duration } from "@kaiord/core";

const positive = (value: unknown): number | null =>
  typeof value === "number" && value > 0 ? value : null;

const heartRateBelow = (tcxDuration: Record<string, unknown>) => {
  const heartRate = tcxDuration.HeartRate as
    Record<string, unknown> | undefined;
  if (heartRate?.["@_xsi:type"] !== "HeartRateInBeatsPerMinute_t") return null;
  const bpm = positive(heartRate.Value);
  return bpm === null ? null : { type: "heart_rate_less_than" as const, bpm };
};

export const convertStandardTcxDuration = (
  tcxDuration: Record<string, unknown>
): Duration | null => {
  const durationType = tcxDuration["@_xsi:type"] as string | undefined;
  if (durationType === "Time_t") {
    const seconds = positive(tcxDuration.Seconds);
    return seconds === null ? null : { type: "time", seconds };
  }
  if (durationType === "Distance_t") {
    const meters = positive(tcxDuration.Meters);
    return meters === null ? null : { type: "distance", meters };
  }
  if (durationType === "CaloriesBurned_t") {
    const calories = positive(tcxDuration.Calories);
    return calories === null ? null : { type: "calories", calories };
  }
  if (durationType === "HeartRateBelow_t") return heartRateBelow(tcxDuration);
  if (durationType === "LapButton_t" || durationType === "UserInitiated_t") {
    return { type: "open" };
  }
  return null;
};
