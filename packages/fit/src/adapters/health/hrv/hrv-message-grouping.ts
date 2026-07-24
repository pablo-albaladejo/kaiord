import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const HRV_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.HRV_STATUS_SUMMARY]:
    fitMessageKeySchema.enum.hrvStatusSummaryMesgs,
  [FIT_MESSAGE_NUMBERS.HRV_VALUE]: fitMessageKeySchema.enum.hrvValueMesgs,
};

/**
 * Groups the flat list emitted by `convertKrdToFitHealthHrvMessages`
 * into the SDK-style keyed shape the FIT encoder consumes.
 */
export const groupHrvMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, HRV_MESG_NUM_TO_KEY);
