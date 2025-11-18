import type { WorkoutStep } from "../../../domain/schemas/workout";
import type { Logger } from "../../../ports/logger";
import { convertPowerZoneToPercentFtp } from "../target/target.converter";

export const encodeSteadyStatePowerTarget = (
  step: WorkoutStep,
  interval: Record<string, unknown>
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

    const assumedFtp = 250;
    interval["@_kaiord:assumedFtp"] = assumedFtp;
    const percentFtp = (step.target.value.value / assumedFtp) * 100;
    interval["@_Power"] = percentFtp / 100;
  }
};

export const encodeRampPowerTarget = (
  step: WorkoutStep,
  interval: Record<string, unknown>,
  logger?: Logger
): void => {
  if (step.target.type !== "power") return;

  if (step.target.value.unit === "range") {
    let powerLow = step.target.value.min;
    let powerHigh = step.target.value.max;

    interval["@_kaiord:powerUnit"] = "watts";

    const assumedFtp = 250;
    const originalLow = powerLow;
    const originalHigh = powerHigh;
    powerLow = (powerLow / assumedFtp) * 100;
    powerHigh = (powerHigh / assumedFtp) * 100;

    interval["@_kaiord:originalWattsLow"] = originalLow;
    interval["@_kaiord:originalWattsHigh"] = originalHigh;
    interval["@_kaiord:assumedFtp"] = assumedFtp;

    logger?.warn("Lossy conversion: watts converted to percent FTP", {
      originalWatts: { low: originalLow, high: originalHigh },
      assumedFtp,
      convertedPercentFtp: { low: powerLow, high: powerHigh },
      stepIndex: step.stepIndex,
    });

    interval["@_PowerLow"] = powerLow / 100;
    interval["@_PowerHigh"] = powerHigh / 100;
  } else if (step.target.value.unit === "zone") {
    interval["@_kaiord:powerUnit"] = "zone";
    interval["@_kaiord:powerZone"] = step.target.value.value;

    const percentFtp = convertPowerZoneToPercentFtp(step.target.value.value);
    interval["@_PowerLow"] = percentFtp / 100;
    interval["@_PowerHigh"] = percentFtp / 100;
  } else if (step.target.value.unit === "percent_ftp") {
    interval["@_kaiord:powerUnit"] = "percent_ftp";

    interval["@_PowerLow"] = step.target.value.value / 100;
    interval["@_PowerHigh"] = step.target.value.value / 100;
  }
};
