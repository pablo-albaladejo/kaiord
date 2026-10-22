import type { Logger, WorkoutStep } from "@kaiord/core";

import { isPowerDescending } from "../interval/power-direction";
import { convertPowerZoneToPercentFtp } from "../target/power.converter";

// No FTP in KRD watts targets; 250 W is a conventional default road-cyclist FTP
// used only to derive Zwift's required %FTP fraction.
const ASSUMED_FTP_WATTS = 250;

export const encodeSteadyStatePowerTarget = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type !== "power") return;

  if (step.target.value.unit === "percent_ftp") {
    interval["@_kaiord:powerUnit"] = "percent_ftp";
    interval["@_Power"] = step.target.value.value / 100;
  } else if (step.target.value.unit === "zone") {
    interval["@_kaiord:powerUnit"] = "zone";
    interval["@_kaiord:powerZone"] = step.target.value.value;

    const percentFtp = convertPowerZoneToPercentFtp(step.target.value.value);
    interval["@_Power"] = percentFtp / 100;
  } else if (step.target.value.unit === "watts") {
    interval["@_kaiord:powerUnit"] = "watts";
    interval["@_kaiord:originalWatts"] = step.target.value.value;

    interval["@_kaiord:assumedFtp"] = ASSUMED_FTP_WATTS;
    const percentFtp = (step.target.value.value / ASSUMED_FTP_WATTS) * 100;
    interval["@_Power"] = percentFtp / 100;

    logger?.warn("Lossy conversion: watts converted to percent FTP", {
      originalWatts: step.target.value.value,
      assumedFtp: ASSUMED_FTP_WATTS,
      stepIndex: step.stepIndex,
    });
  }
};

const encodeWattsRange = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  [low, high]: readonly [number, number],
  logger?: Logger
): void => {
  const powerLow = (low / ASSUMED_FTP_WATTS) * 100;
  const powerHigh = (high / ASSUMED_FTP_WATTS) * 100;

  interval["@_kaiord:powerUnit"] = "watts";
  interval["@_kaiord:originalWattsLow"] = low;
  interval["@_kaiord:originalWattsHigh"] = high;
  interval["@_kaiord:assumedFtp"] = ASSUMED_FTP_WATTS;

  logger?.warn("Lossy conversion: watts converted to percent FTP", {
    originalWatts: { low, high },
    assumedFtp: ASSUMED_FTP_WATTS,
    convertedPercentFtp: { low: powerLow, high: powerHigh },
    stepIndex: step.stepIndex,
  });

  interval["@_PowerLow"] = powerLow / 100;
  interval["@_PowerHigh"] = powerHigh / 100;
};

export const encodeRampPowerTarget = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type !== "power") return;
  const value = step.target.value;

  if (value.unit === "range") {
    // A descending block starts at the top bound: PowerLow > PowerHigh.
    const [from, to] = isPowerDescending(step)
      ? [value.max, value.min]
      : [value.min, value.max];
    if (value.basis === "percent_ftp") {
      interval["@_kaiord:powerUnit"] = "percent_ftp";
      interval["@_PowerLow"] = from / 100;
      interval["@_PowerHigh"] = to / 100;
    } else {
      encodeWattsRange(step, interval, [from, to], logger);
    }
  } else if (value.unit === "zone") {
    interval["@_kaiord:powerUnit"] = "zone";
    interval["@_kaiord:powerZone"] = value.value;

    const percentFtp = convertPowerZoneToPercentFtp(value.value);
    interval["@_PowerLow"] = percentFtp / 100;
    interval["@_PowerHigh"] = percentFtp / 100;
  } else if (value.unit === "percent_ftp") {
    interval["@_kaiord:powerUnit"] = "percent_ftp";

    interval["@_PowerLow"] = value.value / 100;
    interval["@_PowerHigh"] = value.value / 100;
  }
};
