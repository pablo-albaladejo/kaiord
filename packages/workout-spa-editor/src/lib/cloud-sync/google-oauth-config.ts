/**
 * Google OAuth Config
 *
 * Single source for the public Google Cloud OAuth Client ID and the
 * `drive.appdata` scope used by the cross-device sync adapter. The client
 * id is read from `import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID` (a public
 * value committed in `.env`; Google client IDs are not secrets). Feature
 * code MUST go through `resolveGoogleOAuthClientId()` rather than reading
 * the env var inline, so an unset value surfaces one clear error.
 */

/** Confirmed NON-sensitive scope: hidden per-app folder on the user's Drive. */
export const DRIVE_APPDATA_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata";

/** Google Identity Services client library, loaded lazily at connect time. */
export const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export function resolveGoogleOAuthClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_OAUTH_CLIENT_ID is not set. Cross-device sync needs a " +
        "Google Cloud OAuth Client ID (see .env / docs/google-drive-sync.md)."
    );
  }
  return clientId;
}
