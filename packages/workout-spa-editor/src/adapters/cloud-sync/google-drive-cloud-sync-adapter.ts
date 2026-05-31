/**
 * Google Drive CloudSyncPort adapter
 *
 * Composes the GIS auth layer and the Drive REST file I/O into a
 * `CloudSyncPort`. Auth + I/O only — zero merge logic (the merge engine
 * lives in the application layer). The default factory wires the real
 * GIS auth and `fetch`-based REST; tests inject fakes via the `deps`
 * form.
 *
 * Note: this adapter carries NO snapshot diffing or conflict resolution;
 * `expectedRevision` is forwarded to the caller's optimistic-concurrency
 * check, not interpreted here.
 */

import { resolveGoogleOAuthClientId } from "../../lib/cloud-sync/google-oauth-config";
import type { CloudSyncPort } from "../../ports/cloud-sync-port";
import { createDriveRest, type DriveRest } from "./drive-rest";
import { createGisAuth, type GisAuth } from "./gis-token-client";

export type GoogleDriveCloudSyncDeps = {
  auth: GisAuth;
  rest: DriveRest;
};

export function createGoogleDriveCloudSyncAdapter(
  deps: GoogleDriveCloudSyncDeps
): CloudSyncPort {
  const { auth, rest } = deps;
  return {
    isAuthenticated: () => auth.isAuthenticated(),
    authenticate: () => auth.authenticate(),
    pull: () => rest.download(),
    push: (snapshot) => rest.upload(snapshot),
  };
}

export function createGoogleDriveCloudSync(clientId?: string): CloudSyncPort {
  const auth = createGisAuth(clientId ?? resolveGoogleOAuthClientId());
  const rest = createDriveRest(() => auth.getAccessToken());
  return createGoogleDriveCloudSyncAdapter({ auth, rest });
}
