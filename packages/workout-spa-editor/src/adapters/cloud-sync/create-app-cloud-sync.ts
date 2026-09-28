/**
 * The app's cloud-sync adapter: Google Drive wrapped in optional
 * end-to-end encryption. Loaded on first sync use through
 * `createLazyCloudSync` (see `main.tsx`), never statically from the entry.
 */

import { getSyncPassphrase } from "../../lib/cloud-sync/encryption-runtime";
import { isEncryptionEnabled } from "../../lib/cloud-sync/sync-encryption-pref";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { withEncryption } from "./encrypting-cloud-sync";
import { createGoogleDriveCloudSync } from "./google-drive-cloud-sync-adapter";

export function createAppCloudSync(): CloudSyncPort {
  return withEncryption(createGoogleDriveCloudSync(), {
    isEnabled: isEncryptionEnabled,
    getPassphrase: getSyncPassphrase,
  });
}
