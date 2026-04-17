---
title: Privacy Policy
description: Kaiord privacy policy covering the website, documentation, and Chrome extensions.
---

<!-- cSpell:words CCPA -->

# Privacy Policy

**Last updated:** 2026-04-17

This privacy policy describes how the Kaiord project ("we", "us") handles data across all its products: the website (kaiord.com), documentation (kaiord.com/docs), the Kaiord workout editor, the Kaiord Garmin Bridge Chrome extension, and the Kaiord Train2Go Bridge Chrome extension.

## Data Collection

Kaiord does **not** collect any personal data, analytics, or telemetry. We do not use cookies for tracking. We do not use any third-party analytics services.

## Kaiord Garmin Bridge Extension

The Kaiord Garmin Bridge Chrome extension connects the Kaiord workout editor to Garmin Connect via your browser session. Here is how it handles data:

- **CSRF Token**: The extension captures a CSRF token from Garmin Connect requests and stores it in `chrome.storage.session`. This storage is encrypted, memory-only, and cleared when you close your browser. The token is never persisted to disk.
- **No Credentials**: The extension never reads, stores, or transmits your Garmin Connect password or OAuth tokens. Authentication relies entirely on your existing browser session cookies.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `connect.garmin.com` (to execute API calls) and allowed Kaiord origins (to receive workout data from the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord Train2Go Bridge Extension

The Kaiord Train2Go Bridge Chrome extension imports coaching plans from Train2Go into the Kaiord workout editor by reading the training plan displayed on Train2Go pages you are already viewing. Here is how it handles data:

- **No Data Persistence**: The extension stores no data locally. Training plan data is read on-demand from the Train2Go page DOM and sent directly to the Kaiord workout editor. Nothing is written to `chrome.storage`, cookies, or disk.
- **No Credentials**: The extension never reads, stores, or transmits your Train2Go password or authentication tokens. It relies entirely on your existing browser session, and only reads the training plan rendered on the page.
- **Read-Only DOM Access**: The content script only reads the coaching plan from pages on `app.train2go.com`. It does not modify the page, submit forms, or make authenticated API calls on your behalf.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `app.train2go.com` (via its content script) and allowed Kaiord origins (to deliver imported workouts to the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Communication Scope

The extensions only communicate with the following domains:

- `https://connect.garmin.com/*` — Garmin Bridge content script proxies API requests using your existing session
- `https://app.train2go.com/*` — Train2Go Bridge content script reads the coaching plan from the page
- `https://*.kaiord.com/*` — both extensions receive workout requests from, and deliver workouts to, the Kaiord workout editor (via Chrome's `externally_connectable` messaging)

No other domains are contacted in production builds. During local development, both extensions additionally accept messages from `http://localhost:5173` and `http://localhost:5174` (Vite dev server). These origins are stripped from the production manifests (`manifest.prod.json`) before publishing to the Chrome Web Store.

## Open Source

Kaiord is fully open source. You can inspect the complete source code, including both extensions, at [github.com/pablo-albaladejo/kaiord](https://github.com/pablo-albaladejo/kaiord).

## Regulatory Compliance

Because Kaiord does not collect, process, or store any personal data, there is no personal data to protect, share, or delete. This applies under all applicable data protection regulations, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

If you believe any of your data has been inadvertently collected, please contact us and we will investigate immediately.

## Contact

For privacy inquiries, please open an issue on the [GitHub repository](https://github.com/pablo-albaladejo/kaiord/issues) or contact the project maintainer, Pablo Albaladejo.
