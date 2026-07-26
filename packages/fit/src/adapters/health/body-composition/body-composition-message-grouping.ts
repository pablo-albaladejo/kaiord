import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../../shared/message-grouping";
import { FIT_MESSAGE_NUMBERS } from "../../shared/message-numbers";

const BODY_COMPOSITION_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.BODY_COMPOSITION]:
    fitMessageKeySchema.enum.bodyCompositionMesgs,
};

/**
 * Groups the flat list emitted by
 * `convertKrdToFitHealthBodyCompositionMessages` into the SDK-style
 * keyed shape the FIT encoder consumes.
 */
export const groupBodyCompositionMessages = (
  rawMessages: Record<string, unknown>[]
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, BODY_COMPOSITION_MESG_NUM_TO_KEY);
