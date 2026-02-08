import type { Equipment } from "@kaiord/core";
import type { z } from "zod";
import type {
  equipmentTypeKeySchema,
  GarminEquipmentType,
} from "../schemas/common";

type EquipmentTypeKey = NonNullable<z.infer<typeof equipmentTypeKeySchema>>;

const GARMIN_TO_KRD_EQUIPMENT: Record<string, Equipment> = {
  fins: "swim_fins",
  kickboard: "swim_kickboard",
  paddles: "swim_paddles",
  pull_buoy: "swim_pull_buoy",
  snorkel: "swim_snorkel",
};

const KRD_TO_GARMIN_EQUIPMENT: Record<
  string,
  { id: number; key: EquipmentTypeKey; order: number }
> = {
  swim_fins: { id: 1, key: "fins", order: 1 },
  swim_kickboard: { id: 2, key: "kickboard", order: 2 },
  swim_paddles: { id: 3, key: "paddles", order: 3 },
  swim_pull_buoy: { id: 4, key: "pull_buoy", order: 4 },
  swim_snorkel: { id: 5, key: "snorkel", order: 5 },
};

export const mapGarminEquipmentToKrd = (
  equipmentTypeKey: string | null
): Equipment | undefined => {
  if (!equipmentTypeKey) return undefined;
  return GARMIN_TO_KRD_EQUIPMENT[equipmentTypeKey];
};

export const mapKrdEquipmentToGarmin = (
  equipment?: Equipment
): GarminEquipmentType => {
  if (!equipment || equipment === "none") {
    return { equipmentTypeId: 0, equipmentTypeKey: null, displayOrder: 0 };
  }
  const mapped = KRD_TO_GARMIN_EQUIPMENT[equipment];
  if (!mapped) {
    return { equipmentTypeId: 0, equipmentTypeKey: null, displayOrder: 0 };
  }
  return {
    equipmentTypeId: mapped.id,
    equipmentTypeKey: mapped.key,
    displayOrder: mapped.order,
  };
};
