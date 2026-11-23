/**
 * Where each fix takes the athlete, per extension.
 *
 * A sign-in URL is the page the extension's own popup opens for the same fix,
 * so the App and the popup send the athlete to one place
 * (`scripts/check-connection-notices.mjs` holds them equal). Install and
 * Update open the extension's store listing where its address is known, and
 * otherwise the docs guide that lists every extension and how to load one
 * that is not published (`scripts/check-site-links.mjs` checks the site
 * serves it). "try-again" has no destination: it re-runs the check where the
 * notice is shown.
 */
import type { ConnectionFix } from "@kaiord/i18n";

export const EXTENSIONS_PAGE_URL =
  "https://kaiord.com/docs/guide/install-extensions";

export const SIGN_IN_URL: Readonly<Record<string, string>> = {
  "garmin-bridge": "https://connect.garmin.com/modern/",
  "train2go-bridge": "https://app.train2go.com/user/index",
  "whoop-bridge": "https://app.whoop.com/",
  "tanita-bridge": "https://mytanita.eu/en/user",
  "trainingpeaks-bridge": "https://app.trainingpeaks.com/",
};

export const STORE_URL: Readonly<Record<string, string>> = {
  "garmin-bridge":
    "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe",
};

export const connectionFixHref = (
  fix: ConnectionFix,
  bridgeId: string | null
): string | null => {
  if (fix === "try-again") return null;
  const id = bridgeId ?? "";
  if (fix === "sign-in") return SIGN_IN_URL[id] ?? null;
  return STORE_URL[id] ?? EXTENSIONS_PAGE_URL;
};
