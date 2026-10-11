import type { ActiveProfile } from "../../hooks/use-active-profile-live";
import type { LlmProviderConfig } from "../../store/ai-store-types";

export type ChatGate =
  | { kind: "loading" }
  | { kind: "noProfile" }
  | { kind: "noProvider" }
  | { kind: "missingKey"; label: string }
  | { kind: "ready"; providers: LlmProviderConfig[] };

/**
 * What stands between the user and a chat turn. Every turn reads and writes
 * the active profile's data, so no profile means no chat. A provider restored
 * from a backup has no key and is never offered; when it is the only one, the
 * page names it instead of claiming no provider exists.
 */
export const resolveChatGate = (
  active: ActiveProfile | undefined,
  providers: LlmProviderConfig[] | undefined
): ChatGate => {
  if (active === undefined || providers === undefined)
    return { kind: "loading" };
  if (!active.id) return { kind: "noProfile" };
  const usable = providers.filter((p) => !p.apiKeyMissing);
  if (usable.length > 0) return { kind: "ready", providers: usable };
  const keyless = providers.find((p) => p.apiKeyMissing);
  return keyless
    ? { kind: "missingKey", label: keyless.label }
    : { kind: "noProvider" };
};
