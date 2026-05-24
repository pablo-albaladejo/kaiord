import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
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
): Record<string, unknown[]> => {
  const result: Record<string, unknown[]> = {};
  for (const message of rawMessages) {
    const mesgNum =
      typeof message.mesgNum === "number" ? message.mesgNum : undefined;
    if (mesgNum === undefined) continue;
    const key = WEIGHT_MESG_NUM_TO_KEY[mesgNum];
    if (key) {
      result[key] = [...(result[key] || []), message];
    }
  }
  return result;
};
