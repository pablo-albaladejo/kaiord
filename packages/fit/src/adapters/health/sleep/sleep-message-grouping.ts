import { fitMessageKeySchema } from "../../schemas/fit-message-keys";
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
): Record<string, unknown[]> => {
  const result: Record<string, unknown[]> = {};
  for (const message of rawMessages) {
    const mesgNum =
      typeof message.mesgNum === "number" ? message.mesgNum : undefined;
    if (mesgNum === undefined) continue;
    const key = SLEEP_MESG_NUM_TO_KEY[mesgNum];
    if (key) {
      result[key] = [...(result[key] || []), message];
    }
  }
  return result;
};
