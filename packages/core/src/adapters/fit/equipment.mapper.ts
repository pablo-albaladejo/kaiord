import { equipmentSchema, type Equipment } from "../../domain/schemas/equipment";
import { fitEquipmentSchema, type FitEquipment } from "./schemas/fit-equipment";

const FIT_TO_KRD_EQUIPMENT_MAP: Record<FitEquipment, Equipment> = {
  none: "none",
  swimFins: "swim_fins",
  swimKickboard: "swim_kickboard",
  swimPaddles: "swim_paddles",
  swimPullBuoy: "swim_pull_buoy",
  swimSnorkel: "swim_snorkel",
};

const KRD_TO_FIT_EQUIPMENT_MAP: Record<Equipment, FitEquipment> =
  Object.fromEntries(
    Object.entries(FIT_TO_KRD_EQUIPMENT_MAP).map(([fit, krd]) => [krd, fit])
  ) as Record<Equipment, FitEquipment>;

export const mapEquipmentToKrd = (fitEquipment: unknown): Equipment => {
  const result = fitEquipmentSchema.safeParse(fitEquipment);

  if (!result.success) {
    return equipmentSchema.enum.none;
  }

  return FIT_TO_KRD_EQUIPMENT_MAP[result.data] || equipmentSchema.enum.none;
};

export const mapEquipmentToFit = (krdEquipment: unknown): FitEquipment => {
  const result = equipmentSchema.safeParse(krdEquipment);

  if (!result.success) {
    return fitEquipmentSchema.enum.none;
  }

  return KRD_TO_FIT_EQUIPMENT_MAP[result.data] || fitEquipmentSchema.enum.none;
};
