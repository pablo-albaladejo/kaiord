import type { KRDMetadata } from "../../../domain/schemas/krd";

type FitExtensions = Record<string, unknown>;

export const addKrdMetadata = (
  workoutFile: Record<string, unknown>,
  metadata: KRDMetadata,
  fitExtensions?: FitExtensions
): void => {
  if (metadata.created) {
    workoutFile["@_kaiord:timeCreated"] = metadata.created;
  }
  if (metadata.manufacturer) {
    workoutFile["@_kaiord:manufacturer"] = metadata.manufacturer;
  }
  if (metadata.product) {
    workoutFile["@_kaiord:product"] = metadata.product;
  }
  if (metadata.serialNumber) {
    workoutFile["@_kaiord:serialNumber"] = metadata.serialNumber;
  }

  if (fitExtensions) {
    if (fitExtensions.type) {
      workoutFile["@_kaiord:fitType"] = fitExtensions.type;
    }
    if (fitExtensions.hrm_fit_single_byte_product_id) {
      workoutFile["@_kaiord:hrmFitProductId"] =
        fitExtensions.hrm_fit_single_byte_product_id;
    }
  }
};
