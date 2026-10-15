/**
 * Resolves every inline value the Settings index renders. One hook per row
 * family keeps each source (Dexie, the sync engine, the bridges) behind the
 * surface that owns it; the row registry only names a `SettingsValueKey`.
 */

import { modelDisplayName, resolveModelForPurpose } from "@kaiord/ai/providers";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAiModelBindingsLive } from "../../../hooks/use-ai-model-bindings-live";
import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { SettingsValueKey } from "./settings-group-types";
import { useSyncValue } from "./use-sync-value";

export type SettingsRowValues = Record<SettingsValueKey, string | undefined>;

export const useSettingsRowValues = (): SettingsRowValues => {
  const t = useTranslate("settings");
  const providers = useAiProvidersLive() ?? [];
  const profileId = useActiveProfileLive()?.id ?? null;
  const bindings = useAiModelBindingsLive(profileId) ?? [];
  const sync = useSyncValue();
  const principal = resolveModelForPurpose("default", providers, bindings);

  return {
    // The athlete's main model, as the resolver resolves it.
    ai: principal ? modelDisplayName(principal.modelId) : undefined,
    sync,
    // Local records are NOT encrypted at rest; only sync snapshots are, and
    // only when the user sets a passphrase. This value stays truthful.
    data: t("values.data.localFirst"),
  };
};
