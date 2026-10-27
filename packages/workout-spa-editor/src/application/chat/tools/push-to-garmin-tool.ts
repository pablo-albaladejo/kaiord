/**
 * Sends a saved workout to Garmin Connect through the browser-extension
 * bridge. An action tool, but the app approves it on the athlete's behalf
 * (no confirmation card); the push operation is injected (`ChatActionOps`) so this layer stays free of React and bridge
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
    "Push a saved workout to Garmin Connect and place it on its date in " +
    "the user's Garmin calendar, so it can be executed on the user's watch " +
    "or device. It runs as soon as it is called, without asking the user, " +
    "so call it only when the user asks to send a workout to Garmin.",
  inputSchema: pushToGarminSchema,
  requiresConfirmation: true,
  execute: (raw) => ops.pushToGarmin(pushToGarminSchema.parse(raw)),
});
