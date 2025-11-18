import type { KRD } from "../../../domain/schemas/krd";
import type { Workout } from "../../../domain/schemas/workout";

export const extractKaiordMetadata = (
  trainingCenterDatabase: Record<string, unknown>,
  workout: Workout
): KRD["metadata"] => {
  const metadata: KRD["metadata"] = {
    created:
      (trainingCenterDatabase["@_kaiord:timeCreated"] as string | undefined) ||
      new Date().toISOString(),
    sport: workout.sport,
    subSport: workout.subSport,
  };

  if (trainingCenterDatabase["@_kaiord:manufacturer"]) {
    metadata.manufacturer = trainingCenterDatabase[
      "@_kaiord:manufacturer"
    ] as string;
  }
  if (trainingCenterDatabase["@_kaiord:product"]) {
    metadata.product = trainingCenterDatabase["@_kaiord:product"] as string;
  }
  if (trainingCenterDatabase["@_kaiord:serialNumber"]) {
    const serialNumber = trainingCenterDatabase["@_kaiord:serialNumber"];
    // Convert to string if it's a number (XML parser may parse as number)
    metadata.serialNumber =
      typeof serialNumber === "number"
        ? String(serialNumber)
        : (serialNumber as string);
  }

  return metadata;
};
