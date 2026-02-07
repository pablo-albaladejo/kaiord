import type { KRD } from "@kaiord/core";

export const addKaiordMetadata = (
  trainingCenterDatabase: Record<string, unknown>,
  krd: KRD
): void => {
  if (krd.metadata.created) {
    trainingCenterDatabase["@_kaiord:timeCreated"] = krd.metadata.created;
  }
  if (krd.metadata.manufacturer) {
    trainingCenterDatabase["@_kaiord:manufacturer"] = krd.metadata.manufacturer;
  }
  if (krd.metadata.product) {
    trainingCenterDatabase["@_kaiord:product"] = krd.metadata.product;
  }
  if (krd.metadata.serialNumber) {
    trainingCenterDatabase["@_kaiord:serialNumber"] = krd.metadata.serialNumber;
  }
};
