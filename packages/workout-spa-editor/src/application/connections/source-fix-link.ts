/**
 * Where a source's own site resolves the problem its card names.
 *
 * Only a source whose fix surface is a plain, account-independent URL belongs
 * here: nothing in these values is constructed from an id, a tenant or a
 * profile, so there is no way for one to resolve to a stranger's page or to a
 * route that does not exist. Each value is the URL that bridge's own popup
 * already uses as its fix-first CTA, so the two surfaces send the user to the
 * same place instead of drifting apart.
 *
 * A source is absent until its URL is proven, and absence renders no link. A
 * wrong destination is worse than no destination, because it looks like a fix.
 */
import type { ConnectionSource } from "./connection-source";

const FIX_URL: Readonly<Record<string, string>> = {
  // packages/whoop-bridge/popup.js — OPEN_WHOOP_URL, the same link its own
  // "Sign in to WHOOP" CTA opens. app.whoop.com redirects a signed-out
  // visitor to WHOOP's sign-in, so this is the surface, not a hop toward it.
  "whoop-bridge": "https://app.whoop.com/",
};

/**
 * The link is offered ONLY in `attention` — the one state whose fix is on the
 * provider's site. A disconnected source is re-linked by the card's own
 * Reconnect, and a missing extension is not installed from the provider's
 * site at all, so neither gets a link that would not fix them.
 */
export const sourceFixUrl = (source: ConnectionSource): string | null => {
  if (source.status !== "attention" || source.bridgeId === null) return null;
  return FIX_URL[source.bridgeId] ?? null;
};
