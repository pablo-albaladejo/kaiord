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
  const requested = input.mode === "priority" ? (input.sourceOrder ?? []) : [];
  const resolved = requested.map((id) => ({ id, key: resolveSourceKey(id) }));
  const unresolved = resolved.flatMap((r) =>
    r.key === undefined ? [r.id] : []
  );
  const sourceOrder = resolved.flatMap((r) =>
    r.key === undefined ? [] : [r.key]
  );
  // Dropping the ids that fail to resolve and keeping the rest would REORDER
  // the request: "whoop-bridge" is not a chat-facing id, so
  // ["whoop-bridge", "tanita"] would durably rank Tanita FIRST — the opposite
  // of what was asked, stored as if it had succeeded, honoured by the resolver
  // and then named by the Connections pill. Partial failure is refused for the
  // same reason total failure is. An empty order is refused too, because
  // `resolveEffectiveSource` reads NO record through a ranked policy whose
  // order is empty.
  if (
    input.mode === "priority" &&
    (unresolved.length > 0 || sourceOrder.length === 0)
  ) {
    return {
      error: "unresolvable_source_order",
      dataType: input.dataType,
      requested,
      unresolved,
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
