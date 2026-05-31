/**
 * GIS Token Client
 *
 * Wraps Google Identity Services `initTokenClient` to obtain a
 * client-side access token for the `drive.appdata` scope. Silent refresh
 * uses `requestAccessToken({ prompt: "" })`; the first consent in a
 * session may surface Google's popup. Auth state (the token) lives only
 * in memory for the session — nothing is persisted here.
 */

import type { GisGlobal, GisTokenClient } from "../../lib/cloud-sync/gis-types";
import { DRIVE_APPDATA_SCOPE } from "../../lib/cloud-sync/google-oauth-config";
import { loadGisScript } from "../../lib/cloud-sync/load-gis-script";

export type GisAuth = {
  isAuthenticated: () => boolean;
  authenticate: () => Promise<void>;
  getAccessToken: () => string | null;
};

function oauth2() {
  const oauth = (window as unknown as GisGlobal).google?.accounts?.oauth2;
  if (!oauth) throw new Error("Google Identity Services not available");
  return oauth;
}

export function createGisAuth(clientId: string): GisAuth {
  let accessToken: string | null = null;
  let client: GisTokenClient | null = null;

  const ensureClient = (resolve: () => void, reject: (e: Error) => void) =>
    oauth2().initTokenClient({
      client_id: clientId,
      scope: DRIVE_APPDATA_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "no access_token returned"));
          return;
        }
        accessToken = response.access_token;
        resolve();
      },
    });

  return {
    isAuthenticated: () => accessToken !== null,
    getAccessToken: () => accessToken,
    authenticate: async () => {
      await loadGisScript();
      await new Promise<void>((resolve, reject) => {
        client = ensureClient(resolve, reject);
        // Empty prompt requests a silent token, falling back to the
        // consent popup only when no prior grant exists for this client.
        client.requestAccessToken({ prompt: "" });
      });
    },
  };
}
