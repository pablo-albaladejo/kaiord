/**
 * What the Kaiord App knows of each of the five extensions, one descriptor
 * each: the Bridge protocol versions it accepts (the current one and the one
 * before it, so an extension waiting for its update keeps working, ADR
 * 0004), the page its Sign in fix opens (the one its popup opens:
 * `scripts/check-connection-notices.mjs` holds them equal), its store
 * listing where the address is known, and why its Session check may ask
 * nothing, worded by the shared notices.
 */
import type { NotCheckedReason } from "@kaiord/i18n";

export type ExtensionDescriptor = {
  readonly protocols: readonly number[];
  readonly signInUrl: string;
  readonly storeUrl?: string;
  /** The check on the previous protocol, or every check, asks nothing. */
  readonly notChecked?: NotCheckedReason;
};

const CURRENT_AND_PREVIOUS = [1, 2] as const;

export const EXTENSIONS = {
  "garmin-bridge": {
    protocols: CURRENT_AND_PREVIOUS,
    signInUrl: "https://connect.garmin.com/modern/",
    storeUrl:
      "https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe",
    notChecked: "would-mint-token",
  },
  "train2go-bridge": {
    protocols: CURRENT_AND_PREVIOUS,
    signInUrl: "https://app.train2go.com/user/index",
  },
  "whoop-bridge": {
    protocols: CURRENT_AND_PREVIOUS,
    signInUrl: "https://app.whoop.com/",
    notChecked: "no-token-captured",
  },
  "tanita-bridge": {
    protocols: CURRENT_AND_PREVIOUS,
    signInUrl: "https://mytanita.eu/en/user",
  },
  "trainingpeaks-bridge": {
    protocols: CURRENT_AND_PREVIOUS,
    signInUrl: "https://app.trainingpeaks.com/",
    notChecked: "would-mint-token",
  },
} as const satisfies Readonly<Record<string, ExtensionDescriptor>>;

export type ExtensionId = keyof typeof EXTENSIONS;

export const extensionOf = (
  bridgeId: string | null
): ExtensionDescriptor | undefined =>
  bridgeId !== null && Object.hasOwn(EXTENSIONS, bridgeId)
    ? EXTENSIONS[bridgeId as ExtensionId]
    : undefined;
