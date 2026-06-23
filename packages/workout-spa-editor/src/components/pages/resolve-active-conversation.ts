/**
 * Pure resolver for which conversation is active on the chat page.
 *
 * Route id wins when it is a persisted conversation (deep link) or the current
 * unsaved draft; an unknown/foreign route id resolves to "no thread selected"
 * (the list still renders) so a link never leaks another profile's data. With
 * no route id, the current draft wins, else the most-recently-updated
 * conversation, else nothing.
 */

export type ActiveConversation = { activeId: string | null; isDraft: boolean };

export type ResolveActiveConversationArgs = {
  routeId: string | undefined;
  draftId: string | null;
  persistedIds: ReadonlyArray<string>;
  firstId: string | undefined;
};

export const resolveActiveConversation = ({
  routeId,
  draftId,
  persistedIds,
  firstId,
}: ResolveActiveConversationArgs): ActiveConversation => {
  const isPersisted = (id: string) => persistedIds.includes(id);
  if (routeId) {
    if (isPersisted(routeId)) return { activeId: routeId, isDraft: false };
    if (routeId === draftId) return { activeId: draftId, isDraft: true };
    return { activeId: null, isDraft: false };
  }
  if (draftId) return { activeId: draftId, isDraft: !isPersisted(draftId) };
  if (firstId) return { activeId: firstId, isDraft: false };
  return { activeId: null, isDraft: false };
};
