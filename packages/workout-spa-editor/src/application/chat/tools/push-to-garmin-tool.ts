/**
 * Sends a saved workout to Garmin Connect through the browser-extension
 * bridge. Confirmation-gated like every action tool; the push operation is
 * injected (`ChatActionOps`) so this layer stays free of React and bridge
 * transports.
 */
import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { ChatActionOps } from "./chat-tool-deps";

const pushToGarminSchema = z.object({
  workoutId: z.string().min(1).describe("Id of the saved workout to push"),
});

export const createPushToGarminTool = (ops: ChatActionOps): ChatTool => ({
  name: "push_to_garmin",
  description:
    "Push a saved workout to Garmin Connect so it can be executed on the " +
    "user's watch or device. Requires the user to confirm before running.",
  inputSchema: pushToGarminSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.pushToGarmin(pushToGarminSchema.parse(raw)),
});
