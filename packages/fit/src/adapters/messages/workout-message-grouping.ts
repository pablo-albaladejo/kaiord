import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { FIT_MESSAGE_NUMBERS } from "../shared/message-numbers";

const WORKOUT_MESG_NUM_TO_KEY: Record<number, string> = {
  [FIT_MESSAGE_NUMBERS.FILE_ID]: fitMessageKeySchema.enum.fileIdMesgs,
  [FIT_MESSAGE_NUMBERS.WORKOUT]: fitMessageKeySchema.enum.workoutMesgs,
  [FIT_MESSAGE_NUMBERS.WORKOUT_STEP]: fitMessageKeySchema.enum.workoutStepMesgs,
};

/**
 * Groups the flat list emitted by `convertKRDToMessages` into the
 * SDK-style keyed shape the FIT encoder consumes.
 */
export const groupWorkoutMessages = (
  rawMessages: unknown[]
): Record<string, unknown[]> => {
  const result: Record<string, unknown[]> = {};
  for (const msg of rawMessages) {
    const message = msg as { mesgNum?: number };
    if (typeof message.mesgNum !== "number") continue;
    const key = WORKOUT_MESG_NUM_TO_KEY[message.mesgNum];
    if (key) {
      result[key] = [...(result[key] || []), message];
    }
  }
  return result;
};
