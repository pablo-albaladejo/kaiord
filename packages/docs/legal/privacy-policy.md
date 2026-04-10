---
title: Privacy Policy
description: Kaiord privacy policy covering the website, documentation, and Chrome extension.
---

<!-- cSpell:words CCPA -->

# Privacy Policy

**Last updated:** 2026-04-10

This privacy policy describes how the Kaiord project ("we", "us") handles data across all its products: the website (kaiord.com), documentation (kaiord.com/docs), the Kaiord workout editor, and the Kaiord Garmin Bridge Chrome extension.

## Data Collection

Kaiord does **not** collect any personal data, analytics, or telemetry. We do not use cookies for tracking. We do not use any third-party analytics services.

## Kaiord Garmin Bridge Extension

The Kaiord Garmin Bridge Chrome extension connects the Kaiord workout editor to Garmin Connect via your browser session. Here is how it handles data:

- **CSRF Token**: The extension captures a CSRF token from Garmin Connect requests and stores it in `chrome.storage.session`. This storage is encrypted, memory-only, and cleared when you close your browser. The token is never persisted to disk.
- **No Credentials**: The extension never reads, stores, or transmits your Garmin Connect password or OAuth tokens. Authentication relies entirely on your existing browser session cookies.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `connect.garmin.com` (to execute API calls) and allowed Kaiord origins (to receive workout data from the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Communication Scope

The extension only communicates with:

- `https://connect.garmin.com/*` — via a content script that proxies API requests using your existing session
- `https://*.kaiord.com/*` — to receive workout push requests from the Kaiord workout editor

No other domains are contacted.

## Open Source

Kaiord is fully open source. You can inspect the complete source code, including the extension, at [github.com/pablo-albaladejo/kaiord](https://github.com/pablo-albaladejo/kaiord).

## Regulatory Compliance

Because Kaiord does not collect, process, or store any personal data, there is no personal data to protect, share, or delete. This applies under all applicable data protection regulations, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

If you believe any of your data has been inadvertently collected, please contact us and we will investigate immediately.

## Contact

For privacy inquiries, please open an issue on the [GitHub repository](https://github.com/pablo-albaladejo/kaiord/issues) or contact the project maintainer, Pablo Albaladejo.
