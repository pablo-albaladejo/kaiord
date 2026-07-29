/**
 * Applies the three `set_data_route` actions and returns the resulting
 * persisted state so the assistant can confirm it in natural language.
 */
import type { SetDataRouteInput } from "../../application/chat/tools/chat-tool-deps";
import type { PersistencePort } from "../../ports/persistence-port";
import { applyRouteToggle } from "./apply-route-toggle";
import { resolveSourceKey } from "./resolve-integration-key";

type SourcePolicyInput = Extract<
  SetDataRouteInput,
  { action: "set_source_policy" }
>;

const applySourcePolicy = async (
  persistence: PersistencePort,
  profileId: string,
  input: SourcePolicyInput
): Promise<unknown> => {
  const sourceOrder =
    input.mode === "priority"
      ? (input.sourceOrder ?? [])
          .map(resolveSourceKey)
          .filter((id): id is string => id !== undefined)
      : [];
  // The tool schema already rejects `priority` with an empty sourceOrder; this
  // is the same rule applied AFTER resolution, where ids the model plausibly
  // emits drop out silently — "strava" and "wahoo" are real registry entries
  // with no bridge id, and "whoop-bridge" is not a chat-facing id at all.
  // Persisting the mode without its ordering stores a policy `resolveEffective
  // Source` reads NO record through, and leaves every reader to invent a head.
  if (input.mode === "priority" && sourceOrder.length === 0) {
    return {
      error: "unresolvable_source_order",
      dataType: input.dataType,
      sourceOrder: input.sourceOrder ?? [],
    };
  }
  await persistence.dataTypeSourcePolicy.put({
    profileId,
    dataType: input.dataType,
    mode: input.mode,
    sourceOrder,
  });
  return { dataType: input.dataType, mode: input.mode, sourceOrder };
};

export const doSetDataRoute = (
  persistence: PersistencePort,
  profileId: string,
  input: SetDataRouteInput
): Promise<unknown> =>
  input.action === "set_source_policy"
    ? applySourcePolicy(persistence, profileId, input)
    : applyRouteToggle(persistence, profileId, input);
