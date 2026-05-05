import type { Target } from "@kaiord/core";
import { targetTypeSchema } from "@kaiord/core";

import { convertZwiftPowerTarget } from "../target/target.converter";
import type { ZwiftSteadyStateData } from "./steady-state.mapper";
import { restoreHeartRateTarget } from "./target-restoration";

export const restoreSteadyStateTarget = (
  data: ZwiftSteadyStateData
): Target => {
  if (data["kaiord:powerUnit"] === "watts" && data["kaiord:originalWatts"]) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "watts",
        value: data["kaiord:originalWatts"],
      },
    };
  }

  if (data["kaiord:powerUnit"] === "zone" && data["kaiord:powerZone"]) {
    return {
      type: targetTypeSchema.enum.power,
      value: {
        unit: "zone",
        value: data["kaiord:powerZone"],
      },
    };
  }

  if (data.Power !== undefined) {
    return convertZwiftPowerTarget(data.Power);
  }

  const hrTarget = restoreHeartRateTarget(data);
  return hrTarget || { type: targetTypeSchema.enum.open };
};
