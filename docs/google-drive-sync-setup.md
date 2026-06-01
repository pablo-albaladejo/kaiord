# Google Drive cross-device sync — setup

The workout SPA editor can sync its local data across a user's devices through
the **user's own Google Drive** `appDataFolder`, with no backend. This requires
one piece of configuration: a Google Cloud **OAuth Client ID**. The client ID is
public (it ships in the browser bundle) and is committed as the default in
`packages/workout-spa-editor/.env` as `VITE_GOOGLE_OAUTH_CLIENT_ID`.

## Provisioning a new OAuth Client ID

1. **Project** — create or select a project at
   <https://console.cloud.google.com>.
2. **Enable the Drive API** —
   <https://console.cloud.google.com/apis/library/drive.googleapis.com> → Enable.
   The scope list only shows scopes for enabled APIs.
3. **OAuth consent screen / Branding**
   (<https://console.cloud.google.com/auth/branding>) — User type **External**;
   set app name + support/developer emails. Add `kaiord.com` under **Authorised
   domains**. Homepage / privacy / ToS links are optional while in Testing.
4. **Scope** — at **Data Access**
   (<https://console.cloud.google.com/auth/scopes>) → Add or remove scopes → use
   the **"Manually add scopes"** box to add:
   `https://www.googleapis.com/auth/drive.appdata` → Update → Save.
5. **Test users** — add the Google accounts you will test with (Testing mode is
   limited to ~100 test users).
6. **OAuth Client ID** — at **Credentials**
   (<https://console.cloud.google.com/auth/clients>) → Create client →
   **Web application**. Set **Authorised JavaScript origins** (no trailing
   slash): `http://localhost:5173` (Vite dev) and `https://kaiord.com`
   (production). Leave **Authorised redirect URIs** empty — the GIS token client
   uses the origins, not redirects. Copy the Client ID into
   `VITE_GOOGLE_OAUTH_CLIENT_ID`.

## Scope sensitivity and verification

`drive.appdata` is classified **non-sensitive** by Google: it grants access only
to the app's own hidden `appDataFolder`, never the user's wider Drive. As a
result there is **no sensitive-scope verification gate** for development, and
publishing the consent screen to Production (to lift the ~100 test-user cap) is
straightforward. While the app is in **Testing**, test users may see an
"unverified app" interstitial — choose _Advanced → continue_; this is expected.
Verification later requires owning `kaiord.com` in Google Search Console (already
the case).

## What is stored

A single `kaiord-snapshot.json` file in `appDataFolder` (hidden from the user's
Drive UI, on their own quota). With optional end-to-end encryption enabled, the
snapshot body is AES-256-GCM ciphertext under a user passphrase; the manifest
stays cleartext so other devices can detect encryption and prompt for the
passphrase.
