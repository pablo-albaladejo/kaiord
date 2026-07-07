import type { ChatTool } from "@kaiord/ai";

import {
  createCreateWorkoutTool,
  createLogHealthMetricTool,
  createSyncCoachingTool,
} from "./action-tools";
import type { ChatToolDeps } from "./chat-tool-deps";
import { createGetDataRoutesTool } from "./get-data-routes-tool";
import { createGetTodayTool } from "./get-today-tool";
import { createLogIntakeTool } from "./log-intake-tool";
import { createPushToGarminTool } from "./push-to-garmin-tool";
import { createQueryCoachingTool } from "./query-coaching-tool";
import { createQueryEnergyBalanceTool } from "./query-energy-balance-tool";
import { createQueryHealthTool } from "./query-health-tool";
import { createQueryWorkoutsTool } from "./query-workouts-tool";
import { createSetDataRouteTool } from "./set-data-route-tool";

/**
 * Assembles the full chat tool registry for one conversation. Read tools
 * are bound to profile-scoped persistence; action tools are bound to the
 * injected, confirmation-gated operations. Passed straight to
 * `createChatAgent({ tools })`.
 */
export const buildChatTools = (deps: ChatToolDeps): ChatTool[] => {
  const read = {
    persistence: deps.persistence,
    profileId: deps.profileId,
    today: deps.today,
  };
  return [
    createGetTodayTool({ today: deps.today }),
    createQueryWorkoutsTool(read),
    createQueryHealthTool(read),
    createQueryEnergyBalanceTool(read),
    createQueryCoachingTool(read),
    createGetDataRoutesTool({
      ...read,
      getMatrixSignals: deps.getMatrixSignals,
    }),
    createSyncCoachingTool(deps.actions),
    createCreateWorkoutTool(deps.actions),
    createLogHealthMetricTool(deps.actions),
    createLogIntakeTool(deps.actions),
    createPushToGarminTool(deps.actions),
    createSetDataRouteTool(deps.actions),
  ];
};
