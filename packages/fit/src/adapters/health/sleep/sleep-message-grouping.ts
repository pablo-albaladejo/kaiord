import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const SLEEP_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.SLEEP_LEVEL]: fitMessageKeySchema.enum.sleepLevelMesgs,
};

/**
 * Groups the flat list of FIT messages emitted by
 * `convertKrdToFitHealthSleepMessages` into the SDK-style keyed shape
 * (`{ fileIdMesgs: [...], sleepLevelMesgs: [...] }`) that the FIT
 * encoder consumes.
 */
export const groupSleepMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, SLEEP_MESG_NUM_TO_KEY);
