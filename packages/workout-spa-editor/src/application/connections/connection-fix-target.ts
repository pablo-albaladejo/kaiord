/**
 * Where each fix takes the athlete, per extension (`extension-descriptors`).
 *
 * Sign in opens the page the extension's own popup opens for the same fix.
 * Install and Update open the extension's store listing where its address is
 * known, and otherwise the docs guide that lists every extension and how to
 * load one that is not published (`scripts/check-site-links.mjs` checks the
 * site serves it). "try-again" has no destination: it re-runs the check where
 * the notice is shown.
 */
import type { ConnectionFix } from "@kaiord/i18n";

import { extensionOf } from "./extension-descriptors";

export const EXTENSIONS_PAGE_URL =
  "https://kaiord.com/docs/guide/install-extensions";

export const connectionFixHref = (
  fix: ConnectionFix,
  bridgeId: string | null
): string | null => {
  if (fix === "try-again") return null;
  const extension = extensionOf(bridgeId);
  if (fix === "sign-in") return extension?.signInUrl ?? null;
  return extension?.storeUrl ?? EXTENSIONS_PAGE_URL;
};
