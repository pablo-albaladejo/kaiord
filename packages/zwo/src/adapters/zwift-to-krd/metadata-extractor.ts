import type { KRDMetadata } from "@kaiord/core";

type ZwiftWorkoutFile = {
  sportType?: string;
  "@_kaiord:timeCreated"?: string;
  "@_kaiord:manufacturer"?: string;
  "@_kaiord:product"?: string;
  // The reader keeps `kaiord:serialNumber` a string, but a pre-parsed object
  // handed to convertZwiftToKRD may still carry a numeric serial.
  "@_kaiord:serialNumber"?: string | number;
  "@_kaiord:fitType"?: string;
  "@_kaiord:hrmFitProductId"?: number;
};

const toOptionalString = (
  value: string | number | undefined
): string | undefined => (value === undefined ? undefined : String(value));

export const extractMetadata = (
  workoutFile: ZwiftWorkoutFile,
  sport: string
): KRDMetadata => ({
  created: workoutFile["@_kaiord:timeCreated"] || new Date().toISOString(),
  sport,
  manufacturer: workoutFile["@_kaiord:manufacturer"],
  product: workoutFile["@_kaiord:product"],
  serialNumber: toOptionalString(workoutFile["@_kaiord:serialNumber"]),
});

export const extractFitExtensions = (
  workoutFile: ZwiftWorkoutFile
): Record<string, unknown> | undefined => {
  if (
    workoutFile["@_kaiord:fitType"] ||
    workoutFile["@_kaiord:hrmFitProductId"]
  ) {
    return {
      type: workoutFile["@_kaiord:fitType"],
      hrm_fit_single_byte_product_id: workoutFile["@_kaiord:hrmFitProductId"],
    };
  }
  return undefined;
};
