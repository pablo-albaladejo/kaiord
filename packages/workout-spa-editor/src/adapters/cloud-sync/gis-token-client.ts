/**
 * GIS Token Client
 *
 * Wraps Google Identity Services `initTokenClient` to obtain a
 * client-side access token for the `drive.appdata` scope. Silent refresh
 * uses `requestAccessToken({ prompt: "" })`; the first consent in a
 * session may surface Google's popup. Auth state (the token and its
 * expiry) lives only in memory for the session — nothing is persisted here.
 */

import type {
  GisGlobal,
  GisTokenResponse,
} from "../../lib/cloud-sync/gis-types";
import { DRIVE_APPDATA_SCOPE } from "../../lib/cloud-sync/google-oauth-config";
import { loadGisScript } from "../../lib/cloud-sync/load-gis-script";

export type GisAuth = {
  isAuthenticated: () => boolean;
  authenticate: () => Promise<void>;
  getAccessToken: () => string | null;
  /** Forget the token, after Drive refused it. */
  invalidate: () => void;
};

/** Treat a token as expired this long before Google does. */
const EXPIRY_MARGIN_MS = 60_000;
/** GIS tokens last an hour; assumed when the response omits `expires_in`. */
const DEFAULT_LIFETIME_S = 3600;

function oauth2() {
  const oauth = (window as unknown as GisGlobal).google?.accounts?.oauth2;
  if (!oauth) throw new Error("Google Identity Services not available");
  return oauth;
}

export function createGisAuth(
  clientId: string,
  now: () => number = Date.now
): GisAuth {
  let accessToken: string | null = null;
  let expiresAt = 0;
  let pending: Promise<void> | null = null;

  const invalidate = () => {
    accessToken = null;
    expiresAt = 0;
  };

  const store = (response: GisTokenResponse) => {
    const lifetime = Number(response.expires_in ?? DEFAULT_LIFETIME_S);
    accessToken = response.access_token ?? null;
    expiresAt = now() + lifetime * 1000 - EXPIRY_MARGIN_MS;
  };

  const isAuthenticated = () => accessToken !== null && now() < expiresAt;

  const request = (resolve: () => void, reject: (e: Error) => void) =>
    oauth2()
      .initTokenClient({
        client_id: clientId,
        scope: DRIVE_APPDATA_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            invalidate();
            reject(new Error(response.error ?? "no access_token returned"));
            return;
          }
          store(response);
          resolve();
        },
        // A blocked or closed popup never reaches `callback`; without this
        // the promise would hang and the sync would stay "syncing".
        error_callback: (error) => {
          invalidate();
          reject(new Error(error.type));
        },
      })
      // Empty prompt requests a silent token, falling back to the consent
      // popup only when no prior grant exists for this client.
      .requestAccessToken({ prompt: "" });

  return {
    isAuthenticated,
    getAccessToken: () => (isAuthenticated() ? accessToken : null),
    invalidate,
    // One gesture can start two sign-ins (the resume listener and the
    // button it landed on); they share one popup.
    authenticate: () =>
      (pending ??= loadGisScript()
        .then(() => new Promise<void>(request))
        .finally(() => {
          pending = null;
        })),
  };
}
