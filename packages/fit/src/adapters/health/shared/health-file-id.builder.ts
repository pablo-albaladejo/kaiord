import type { KRD } from "@kaiord/core";

import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

/**
 * Builds the FIT `file_id` message that opens every health file, given
 * the Garmin file type the domain encodes as.
 *
 * `product` is only carried when the KRD metadata holds a numeric
 * string, because the FIT field is numeric and a device name would not
 * encode.
 */
export const buildHealthFileIdMessage = (
  krd: KRD,
  fileType: string
): Record<string, unknown> => {
  const fileIdMesg: Record<string, unknown> = {
    mesgNum: FIT_MESSAGE_NUMBERS.FILE_ID,
    type: fileType,
    timeCreated: new Date(krd.metadata.created),
  };
  if (krd.metadata.manufacturer) {
    fileIdMesg.manufacturer = krd.metadata.manufacturer;
  }
  if (krd.metadata.product && /^\d+$/.test(krd.metadata.product)) {
    fileIdMesg.product = Number(krd.metadata.product);
  }
  return fileIdMesg;
};
