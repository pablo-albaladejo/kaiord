---
title: Privacy Policy
description: Kaiord privacy policy covering the website, documentation, Chrome extensions, and optional AI integrations.
---

<!-- cSpell:words CCPA Dexie -->

# Privacy Policy

**Last updated:** 2026-07-21

This privacy policy describes how the Kaiord project ("we", "us") handles data across all its products: the website (kaiord.com), documentation (kaiord.com/docs), the Kaiord workout editor, the Kaiord Garmin Bridge Chrome extension, the Kaiord Train2Go Bridge Chrome extension, and the Kaiord Tanita Bridge Chrome extension.

## Data Controller

Kaiord operates no backend that receives, stores, or processes your data. All processing is entirely client-side — on your device, inside your browser. For GDPR purposes there is therefore no Kaiord-operated data controller. The maintainer (Pablo Albaladejo) is the point of contact for privacy inquiries; see the [Contact](#contact) section.

## Data Collection

Kaiord does **not** collect any personal data, analytics, or telemetry. We do not use cookies for tracking. We do not use any third-party analytics services.

All workout-editor state (workouts, templates, sport-zone profiles, AI provider keys, sync state, chat transcripts) is stored locally in your browser via IndexedDB (Dexie). Nothing is sent to a Kaiord-operated server, ever. This local data remains on your device until you remove it: clear AI provider keys via Settings → Privacy → Clear All API Keys, delete individual workouts via the per-workout delete action, clear a conversation via the assistant's Clear conversation action, or clear site data in your browser to remove everything at once.

If you configure the optional AI features inside the workout editor, your prompts and workout content are sent directly from your browser to the LLM provider you chose (Anthropic, OpenAI, or Google) and are subject to that provider's privacy policy and terms of service. Kaiord does not receive or relay this data; your API key is stored locally and transmitted only to the provider you configured.

When you use the in-app chat assistant, summaries of your locally stored history — including workout, coaching, and health data such as sleep — are sent to the LLM provider you configured, and only while you are actively conversing with the assistant (never in the background). Your chat transcripts are stored locally in your browser like the rest of your editor state and, if you enable cross-device sync, are included in the encrypted snapshot saved to your own cloud storage; they are never sent to a Kaiord-operated server.

## Kaiord Garmin Bridge Extension

The Kaiord Garmin Bridge Chrome extension connects the Kaiord workout editor to Garmin Connect via your browser session. Here is how it handles data:

- **OAuth Token**: The extension mints an OAuth token by reusing your existing Garmin single-sign-on session — it exchanges that session for a short-lived service ticket, then for an OAuth token — and stores the token in `chrome.storage.local` so it can call Garmin's API on your behalf across service-worker restarts. The token is sent only to Garmin (as a Bearer credential) and never leaves your device otherwise.
- **No Password**: The extension never reads, stores, or transmits your Garmin Connect password, and never sees it. Authentication reuses the session you already established by signing in to Garmin Connect in your browser.
- **Body-Composition Upload**: When you choose to sync a measurement, the extension uploads a body-composition record (your weight plus derived metrics such as body-fat percentage) to Garmin Connect as a FIT file, using the `write:body` capability. It only ever sends the data you supply from the editor; it never reads your Garmin body-composition history.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with Garmin (`sso.garmin.com`, `connectapi.garmin.com`, `connect.garmin.com`) and allowed Kaiord origins (to exchange workout and body-composition data with the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord Train2Go Bridge Extension

The Kaiord Train2Go Bridge Chrome extension imports coaching plans from Train2Go pages you are already viewing into the Kaiord workout editor. Here is how it handles data:

- **No Data Persistence**: The extension stores no data locally. Training plan data is read on-demand from the Train2Go page DOM and delivered directly to the Kaiord workout editor (running in your browser). Nothing is transmitted to a Kaiord server; nothing is written to `chrome.storage`, cookies, or disk.
- **No Credentials**: The extension never reads, stores, or transmits your Train2Go password or authentication tokens. It does not declare the `cookies` permission and cannot access your session cookie directly. It only reads the training plan rendered on the page.
- **Read-Only DOM Access**: The content script only reads the coaching plan from pages on `app.train2go.com`. It does not modify the page, submit forms, or make authenticated API calls on your behalf.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `app.train2go.com` (via its content script) and allowed Kaiord origins (to deliver imported workouts to the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord Tanita Bridge Extension

The Kaiord Tanita Bridge Chrome extension reads your MyTANITA body-composition CSV export and hands it to the Kaiord workout editor. Here is how it handles data:

- **No Data Persistence**: The extension stores no measurement data locally. Its service worker fetches your own CSV export from `mytanita.eu` on demand and passes the raw text directly to the Kaiord workout editor (running in your browser). Nothing is transmitted to a Kaiord server; nothing is written to `chrome.storage`, cookies, or disk. Only the `read:body` capability is declared — the extension reads your body-composition export and nothing else.
- **No Credentials, No Password**: The extension never asks for, reads, stores, or transmits your MyTANITA password or any authentication token. It rides your existing logged-in browser session: the request is sent with `credentials:"include"` so your own HttpOnly `TANITASESS` session cookie is attached by the browser. The extension cannot read that cookie's value (it does not declare the `cookies` permission), and it reports session presence to the editor only as a boolean. If the session has expired, the extension surfaces a re-authentication prompt rather than any credential.
- **No mytanita.eu DOM Access**: The extension injects no content script on `mytanita.eu`. It only performs a single, fixed, read-only `GET` of your CSV export; it does not modify the page, submit forms, or call any other endpoint.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `mytanita.eu` (to fetch your export) and allowed Kaiord origins (to deliver the export to the editor). The raw CSV is parsed in the editor, not by the extension.
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Communication Scope

The extensions only communicate with the following domains:

- `https://sso.garmin.com/*` — Garmin Bridge exchanges your existing Garmin sign-in session for a short-lived service ticket (no password is entered or seen)
- `https://connectapi.garmin.com/*` — Garmin Bridge exchanges the ticket for an OAuth token and makes the workout/activity API calls with it
- `https://connect.garmin.com/*` — where you sign in to Garmin Connect; the Garmin Bridge `open-garmin` action opens this page
- `https://app.train2go.com/*` — Train2Go Bridge content script (runs on that domain) reads the coaching plan from the page
- `https://mytanita.eu/*` — Tanita Bridge service worker fetches your body-composition CSV export using your existing session cookie
- `https://*.kaiord.com/*` — the Kaiord editor (running on kaiord.com) sends messages **to** each extension via Chrome's `externally_connectable` channel. This is a one-way inbound channel: the extensions do not read the editor's DOM or cookies.

Each extension also injects a minimal **announce-only** content script (`kaiord-announce.js`) into `https://*.kaiord.com/*` so the editor can discover which extension IDs are installed at runtime. This content script only calls `window.postMessage` to publish a fixed announcement object (bridge id, extension id, version, declared capabilities) and re-announces on request. It does **not** read the editor's DOM, cookies, storage, or network traffic, does **not** modify the page, and does **not** enable any inbound data path from kaiord.com into the extension beyond what `externally_connectable` already allows.

Each extension declares `host_permissions` limited to the hosts listed above — no wildcard or `<all_urls>` access.

No other domains are contacted in production builds. During local development, the extensions additionally accept messages from `http://localhost:5173` and `http://localhost:5174` (Vite dev server), and the announce-only content script is also injected on `http://localhost/*` so locally-served editor builds can discover the extensions. These development-only matches are stripped from the production manifests (`manifest.prod.json`) before publishing to the Chrome Web Store.

## Regulatory Compliance

Because Kaiord operates no backend and collects no personal data server-side, there is no personal data held by us to protect, share, or delete. This applies as long as Kaiord operates no backend and collects no personal data server-side (the state of the system today and at every release), under all applicable data protection regulations, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

You retain all data-subject rights under GDPR and CCPA (access, rectification, erasure, portability). Because Kaiord holds no records about you, a request would return nothing to act upon; if you believe data has been collected or processed in error, please contact us and we will investigate immediately.

## Children's Privacy

The Kaiord products are not directed at children under 13 (or under 16 in jurisdictions where that age applies), and we do not knowingly collect personal information from children. Because we do not collect personal data from anyone, this is trivially true, but we state it explicitly for clarity.

## Changes to this Policy

Material changes to this policy are announced through the project's GitHub release notes and reflected in the "Last updated" date above. This file lives under version control at [`packages/docs/legal/privacy-policy.md`](https://github.com/pablo-albaladejo/kaiord/blob/main/packages/docs/legal/privacy-policy.md); every change is visible via `git log`.

## Open Source

Kaiord is fully open source. You can inspect the complete source code, including both extensions, at [github.com/pablo-albaladejo/kaiord](https://github.com/pablo-albaladejo/kaiord).

## Contact

For privacy inquiries, please open an issue on the [GitHub repository](https://github.com/pablo-albaladejo/kaiord/issues) or contact the project maintainer, Pablo Albaladejo.
