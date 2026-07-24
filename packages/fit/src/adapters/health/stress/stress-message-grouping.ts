import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const STRESS_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.STRESS_LEVEL]: fitMessageKeySchema.enum.stressLevelMesgs,
};

/**
 * Groups the flat list emitted by `convertKrdToFitHealthStressMessages`
 * into the SDK-style keyed shape the FIT encoder consumes.
 */
export const groupStressMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, STRESS_MESG_NUM_TO_KEY);
