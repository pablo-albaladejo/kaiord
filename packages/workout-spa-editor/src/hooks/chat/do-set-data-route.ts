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
