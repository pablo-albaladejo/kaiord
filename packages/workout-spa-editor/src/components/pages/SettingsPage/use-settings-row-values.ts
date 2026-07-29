/**
 * Resolves every inline value the Settings index renders. One hook per row
 * family keeps each source (Dexie, the sync engine, the browser permission)
 * behind the surface that owns it; the row registry only names a
 * `SettingsValueKey`.
 */

import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { useTranslate } from "../../../i18n/use-translate";
import type { SettingsValueKey } from "./settings-group-types";
import { useConnectionsValue } from "./use-connections-value";
import { usePreferenceValues } from "./use-preference-values";
import { useSyncValue } from "./use-sync-value";
import { useUsageValue } from "./use-usage-value";

export type SettingsRowValues = Record<SettingsValueKey, string | undefined>;

export const useSettingsRowValues = (): SettingsRowValues => {
  const t = useTranslate("settings");
  const providers = useAiProvidersLive() ?? [];
  const connections = useConnectionsValue();
  const sync = useSyncValue();
  const usage = useUsageValue();
  const preferences = usePreferenceValues();

  // `...preferences` stays LAST on purpose: TypeScript raises TS2783 on an
  // explicit property a later spread would overwrite, so a future key
  // collision fails to compile. Spreading first would silently override.
  return {
    connections,
    provider: providers.find((p) => p.isDefault)?.label ?? providers[0]?.label,
    sync,
    // Local records are NOT encrypted at rest; only sync snapshots are, and
    // only when the user sets a passphrase. This value stays truthful.
    privacy: t("values.privacy.localFirst"),
    usage,
    ...preferences,
  };
};
