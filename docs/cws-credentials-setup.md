# Chrome Web Store API Credentials Setup

One-time setup for automated CWS publishing via GitHub Actions.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Kaiord CWS Publish")
3. Note the project ID

## 2. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Fill in app name, support email, developer email
4. Add scope: `https://www.googleapis.com/auth/chromewebstore`
5. Set the app to **Production** status (prevents token expiry — test mode tokens expire after 7 days)

## 3. Create OAuth2 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Application type: **Desktop application**
4. Note the **Client ID** and **Client Secret**

## 4. Enable Chrome Web Store API

1. Go to **APIs & Services > Library**
2. Search for "Chrome Web Store API"
3. Click **Enable**

## 5. Generate Refresh Token

Use the `chrome-webstore-upload-cli` built-in auth flow:

```bash
npx chrome-webstore-upload-cli init \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

This starts a local server on `http://127.0.0.1` and opens a browser window for OAuth consent. After authorizing, you receive a **refresh token**.

> **Note:** Google deprecated `urn:ietf:wg:oauth:2.0:oob` in 2023. The CLI tool uses loopback redirect (`http://127.0.0.1`) automatically when using the "Desktop application" client type.

## 6. Get Extension IDs

Repeat these steps for every extension published under this project — each has its own ID:

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click on the extension (e.g. "Kaiord Garmin Bridge", "Kaiord Train2Go Bridge")
3. The extension ID is in the URL: `chrome.google.com/webstore/devconsole/.../<extension-id>/edit`
4. Copy each ID (e.g., `innelncjhkdoalikinkchoppgekennoee`)

The OAuth client (steps 1-5) is shared across every extension, but the `*_EXTENSION_ID` secret is per-extension — the `cws-publish.yml` matrix maps each entry to its secret.

## 7. Add GitHub Secrets

Go to **GitHub repo > Settings > Secrets and variables > Actions** and add:

| Secret Name                  | Value                                                 |
| ---------------------------- | ----------------------------------------------------- |
| `CWS_CLIENT_ID`              | Google Cloud OAuth client ID                          |
| `CWS_CLIENT_SECRET`          | Google Cloud OAuth client secret                      |
| `CWS_REFRESH_TOKEN`          | Refresh token from step 5                             |
| `CWS_EXTENSION_ID`           | Garmin Bridge extension ID from step 6                |
| `CWS_TRAIN2GO_EXTENSION_ID`  | Train2Go Bridge extension ID from step 6              |

The OAuth secrets (`CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`) are shared across every extension; only the `*_EXTENSION_ID` values differ. Add one `*_EXTENSION_ID` secret per extension the project publishes.

## Token Rotation

To rotate the refresh token (recommended periodically or if compromised):

1. Generate a new refresh token using step 5
2. Update the `CWS_REFRESH_TOKEN` secret in GitHub
3. Verify by running the CWS Publish workflow manually (`workflow_dispatch`)

The old token is invalidated once a new one is generated from the same OAuth client. No downtime — update the secret immediately after generating the new token.

## Optional: GitHub Environment Protection

For additional security, consider creating a GitHub Actions environment (e.g., `cws-production`) with required reviewers:

1. Go to **Settings > Environments > New environment**
2. Name: `cws-production`
3. Add protection rules (required reviewers)
4. Move the four CWS secrets to this environment
5. Update `cws-publish.yml` to reference `environment: cws-production`
