import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const DAILY_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.MONITORING_INFO]:
    fitMessageKeySchema.enum.monitoringInfoMesgs,
  [FIT_MESSAGE_NUMBERS.MONITORING]: fitMessageKeySchema.enum.monitoringMesgs,
};

/**
 * Groups the flat list emitted by
 * `convertKrdToFitHealthDailyMessages` into the SDK-style keyed shape
 * the FIT encoder consumes.
 */
export const groupDailyMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, DAILY_MESG_NUM_TO_KEY);
