import { useV10MigrationToast } from "../hooks/use-v10-migration-toast";

/**
 * Lives inside `AppToastProvider` so `useToastContext()` resolves.
 * Fires the Dexie v10 retro-match toast + `coaching.dexie_v10.migrated`
 * analytics event exactly once per app boot (consume-once result slot
 * is StrictMode-safe).
 */
export function MigrationBoot() {
  useV10MigrationToast();
  return null;
}
