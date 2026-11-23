/**
 * Applies `set_authority`: stores the athlete's own choice of Authority for
 * one kind, in the same DataTypeSourcePolicy row the matrix writes, and
 * returns it so the assistant can confirm it in natural language.
 */
import type { SetAuthorityInput } from "../../application/chat/tools/source-tool-inputs";
import type { PersistencePort } from "../../ports/persistence-port";
import { resolveSourceKey } from "./resolve-integration-key";

export const doSetAuthority = async (
  persistence: PersistencePort,
  profileId: string,
  input: SetAuthorityInput
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
