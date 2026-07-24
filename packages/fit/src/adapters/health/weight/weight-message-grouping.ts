import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const WEIGHT_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.WEIGHT_SCALE]: fitMessageKeySchema.enum.weightScaleMesgs,
};

/**
 * Groups the flat list emitted by `convertKrdToFitHealthWeightMessages`
 * into the SDK-style keyed shape the FIT encoder consumes.
 */
export const groupWeightMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, WEIGHT_MESG_NUM_TO_KEY);
