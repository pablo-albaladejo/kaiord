import { targetTypeSchema, type Target } from "../../../domain/schemas/target";

/**
 * Convert Zwift power target (FTP percentage 0.0-3.0) to KRD power target
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 */
export const convertZwiftPowerTarget = (ftpPercentage: number): Target => {
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: "percent_ftp",
      value: ftpPercentage * 100,
    },
  };
};

/**
 * Convert Zwift power range (PowerLow/PowerHigh) to KRD range target
 */
export const convertZwiftPowerRange = (
  powerLow: number,
  powerHigh: number
): Target => {
  return {
    type: targetTypeSchema.enum.power,
    value: {
      unit: "range",
      min: powerLow * 100,
      max: powerHigh * 100,
    },
  };
};

/**
 * Convert KRD power target to Zwift FTP percentage
 * KRD uses percent_ftp (e.g., 85 = 85% FTP)
 * Zwift uses FTP percentage (e.g., 0.85 = 85% FTP)
 */
export const convertKrdPowerToZwift = (percentFtp: number): number => {
  return percentFtp / 100;
};

/**
 * Convert KRD power range to Zwift PowerLow/PowerHigh
 * Returns [PowerLow, PowerHigh] tuple
 */
export const convertKrdPowerRangeToZwift = (
  min: number,
  max: number
): [number, number] => {
  return [min / 100, max / 100];
};

/**
 * Convert power zone (1-7) to percent FTP
 * Uses typical power zone definitions:
 * Zone 1 (Recovery): 55% FTP
 * Zone 2 (Endurance): 75% FTP
 * Zone 3 (Tempo): 90% FTP
 * Zone 4 (Threshold): 105% FTP
 * Zone 5 (VO2 Max): 120% FTP
 * Zone 6 (Anaerobic): 150% FTP
 * Zone 7 (Neuromuscular): 200% FTP
 */
export const convertPowerZoneToPercentFtp = (zone: number): number => {
  const zoneMap: Record<number, number> = {
    1: 55,
    2: 75,
    3: 90,
    4: 105,
    5: 120,
    6: 150,
    7: 200,
  };

  return zoneMap[zone] || 100;
};
