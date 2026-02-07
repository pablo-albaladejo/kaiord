import type { Duration } from "@kaiord/core";

export const convertStandardTcxDuration = (
  tcxDuration: Record<string, unknown>
): Duration | null => {
  const durationType = tcxDuration["@_xsi:type"] as string | undefined;

  if (durationType === "Time_t") {
    const seconds = tcxDuration.Seconds as number | undefined;
    if (typeof seconds === "number" && seconds > 0) {
      return { type: "time", seconds };
    }
  }

  if (durationType === "Distance_t") {
    const meters = tcxDuration.Meters as number | undefined;
    if (typeof meters === "number" && meters > 0) {
      return { type: "distance", meters };
    }
  }

  if (durationType === "LapButton_t") {
    return { type: "open" };
  }

  return null;
};
