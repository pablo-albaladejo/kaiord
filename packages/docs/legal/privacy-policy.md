---
title: Privacy Policy
description: Kaiord privacy policy covering the website, documentation, Chrome extensions, and optional AI integrations.
---

<!-- cSpell:words CCPA Dexie -->

# Privacy Policy

**Last updated:** 2026-04-17

This privacy policy describes how the Kaiord project ("we", "us") handles data across all its products: the website (kaiord.com), documentation (kaiord.com/docs), the Kaiord workout editor, the Kaiord Garmin Bridge Chrome extension, and the Kaiord Train2Go Bridge Chrome extension.

## Data Controller

Kaiord operates no backend that receives, stores, or processes your data. All processing is entirely client-side — on your device, inside your browser. For GDPR purposes there is therefore no Kaiord-operated data controller. The maintainer (Pablo Albaladejo) is the point of contact for privacy inquiries; see the [Contact](#contact) section.

## Data Collection

Kaiord does **not** collect any personal data, analytics, or telemetry. We do not use cookies for tracking. We do not use any third-party analytics services.

All workout-editor state (workouts, templates, sport-zone profiles, AI provider keys, sync state) is stored locally in your browser via IndexedDB (Dexie). Nothing is sent to a Kaiord-operated server, ever. This local data remains on your device until you delete it from the editor (Settings → Privacy → Clear All, or the per-workout delete action) or clear site data in your browser.

If you configure the optional AI features inside the workout editor, your prompts and workout content are sent directly from your browser to the LLM provider you chose (Anthropic, OpenAI, or Google) and are subject to that provider's privacy policy and terms of service. Kaiord does not receive or relay this data; your API key is stored locally and transmitted only to the provider you configured.

## Kaiord Garmin Bridge Extension

The Kaiord Garmin Bridge Chrome extension connects the Kaiord workout editor to Garmin Connect via your browser session. Here is how it handles data:

- **CSRF Token**: The extension captures a CSRF token from Garmin Connect requests and stores it in `chrome.storage.session`. This storage is memory-only, isolated from page scripts, and cleared when you close your browser (Chrome additionally encrypts it when OS-level key material is available). The token is never persisted to disk.
- **Read-Only Header Observation**: The extension observes the `connect-csrf-token` header via `chrome.webRequest` but does not modify requests. It never reads response bodies for the purpose of collection.
- **No Credentials**: The extension never reads, stores, or transmits your Garmin Connect password or OAuth tokens. Authentication relies entirely on your existing browser session cookies.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `connect.garmin.com` (to execute API calls) and allowed Kaiord origins (to receive workout data from the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord Train2Go Bridge Extension

The Kaiord Train2Go Bridge Chrome extension imports coaching plans from Train2Go pages you are already viewing into the Kaiord workout editor. Here is how it handles data:

- **No Data Persistence**: The extension stores no data locally. Training plan data is read on-demand from the Train2Go page DOM and delivered directly to the Kaiord workout editor (running in your browser). Nothing is transmitted to a Kaiord server; nothing is written to `chrome.storage`, cookies, or disk.
- **No Credentials**: The extension never reads, stores, or transmits your Train2Go password or authentication tokens. It does not declare the `cookies` permission and cannot access your session cookie directly. It only reads the training plan rendered on the page.
- **Read-Only DOM Access**: The content script only reads the coaching plan from pages on `app.train2go.com`. It does not modify the page, submit forms, or make authenticated API calls on your behalf.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `app.train2go.com` (via its content script) and allowed Kaiord origins (to deliver imported workouts to the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Communication Scope

The extensions only communicate with the following domains:

- `https://connect.garmin.com/*` — Garmin Bridge content script (runs on that domain) proxies API requests using your existing session
- `https://app.train2go.com/*` — Train2Go Bridge content script (runs on that domain) reads the coaching plan from the page
- `https://*.kaiord.com/*` — the Kaiord editor (running on kaiord.com) sends messages **to** each extension via Chrome's `externally_connectable` channel. This is a one-way inbound channel: the extensions do not read the editor's DOM or cookies.

Each extension declares `host_permissions` limited to the single host listed above — no wildcard or `<all_urls>` access.

No other domains are contacted in production builds. During local development, both extensions additionally accept messages from `http://localhost:5173` and `http://localhost:5174` (Vite dev server). These origins are stripped from the production manifests (`manifest.prod.json`) before publishing to the Chrome Web Store.

## Regulatory Compliance

Because Kaiord operates no backend and collects no personal data server-side, there is no personal data held by us to protect, share, or delete. This applies under all applicable data protection regulations, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

You retain all data-subject rights under GDPR and CCPA (access, rectification, erasure, portability). Because Kaiord holds no records about you, a request would return nothing to act upon; if you believe data has been collected or processed in error, please contact us and we will investigate immediately.

## Children's Privacy

The Kaiord products are not directed at children under 13 (or under 16 in jurisdictions where that age applies), and we do not knowingly collect personal information from children. Because we do not collect personal data from anyone, this is trivially true, but we state it explicitly for clarity.

## Changes to this Policy

Material changes to this policy are announced through the project's GitHub release notes and reflected in the "Last updated" date above. This file lives under version control at [`packages/docs/legal/privacy-policy.md`](https://github.com/pablo-albaladejo/kaiord/blob/main/packages/docs/legal/privacy-policy.md); every change is visible via `git log`.

## Open Source

Kaiord is fully open source. You can inspect the complete source code, including both extensions, at [github.com/pablo-albaladejo/kaiord](https://github.com/pablo-albaladejo/kaiord).

## Contact

For privacy inquiries, please open an issue on the [GitHub repository](https://github.com/pablo-albaladejo/kaiord/issues) or contact the project maintainer, Pablo Albaladejo.
