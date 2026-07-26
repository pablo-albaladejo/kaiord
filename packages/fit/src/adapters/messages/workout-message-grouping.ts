import { fitMessageKeySchema } from "../schemas/fit-message-keys";
import { groupMessagesByNumber } from "../shared/message-grouping";
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
): Record<string, unknown[]> =>
  groupMessagesByNumber(rawMessages, WORKOUT_MESG_NUM_TO_KEY);
