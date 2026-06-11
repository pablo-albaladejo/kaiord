import type { Sport, Target } from "@kaiord/core";
import { targetTypeSchema, targetUnitSchema } from "@kaiord/core";

type ZoneBounds = { low: number; high: number };

const readZoneBounds = (
  zone: Record<string, unknown> | undefined,
  lowKey: string,
  highKey: string
): ZoneBounds | null => {
  if (!zone) return null;
  const low = zone[lowKey];
  const high = zone[highKey];
  if (typeof low !== "number" || typeof high !== "number") return null;
  return { low, high };
};

export const convertSpeedTarget = (
  tcxTarget: Record<string, unknown>
): Target | null => {
  const bounds = readZoneBounds(
    tcxTarget.SpeedZone as Record<string, unknown> | undefined,
    "LowInMetersPerSecond",
    "HighInMetersPerSecond"
  );
  if (!bounds) return null;

  if (bounds.low === bounds.high) {
    return {
      type: targetTypeSchema.enum.pace,
      value: { unit: targetUnitSchema.enum.mps, value: bounds.low },
    };
  }

  return {
    type: targetTypeSchema.enum.pace,
    value: {
      unit: targetUnitSchema.enum.range,
      min: bounds.low,
      max: bounds.high,
    },
  };
};

export const convertCadenceTarget = (
  tcxTarget: Record<string, unknown>,
  sport: Sport
): Target | null => {
  const bounds = readZoneBounds(
    tcxTarget.CadenceZone as Record<string, unknown> | undefined,
    "Low",
    "High"
  );
  if (!bounds) return null;

  // TCX expresses running cadence in steps per minute while KRD standardizes
  // on revolutions per minute; one revolution is two steps (SPM = 2 x RPM).
  const divisor = sport === "running" ? 2 : 1;
  const low = bounds.low / divisor;
  const high = bounds.high / divisor;

  if (low === high) {
    return {
      type: targetTypeSchema.enum.cadence,
      value: { unit: targetUnitSchema.enum.rpm, value: low },
    };
  }

  return {
    type: targetTypeSchema.enum.cadence,
    value: { unit: targetUnitSchema.enum.range, min: low, max: high },
  };
};
