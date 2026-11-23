---
title: Privacy Policy
description: Kaiord privacy policy covering the website, documentation, Chrome extensions, and optional AI integrations.
---

<!-- cSpell:words CCPA Cognito Dexie garth Umami -->

# Privacy Policy

**Last updated:** 2026-11-23

This privacy policy describes how the Kaiord project ("we", "us") handles data across all its products: the website (kaiord.com), documentation (kaiord.com/docs), the Kaiord workout editor, the remote MCP endpoint (kaiord.com/mcp), the remote A2A endpoint (kaiord.com/a2a, not deployed yet), the Kaiord for Garmin Chrome extension, the Kaiord Train2Go Bridge Chrome extension, the Kaiord for Tanita Chrome extension, the Kaiord for TrainingPeaks Chrome extension, and the Kaiord WHOOP Bridge Chrome extension.

## Data Controller

Kaiord operates no backend that stores your data. All processing of your workouts, health data and editor state is client-side — on your device, inside your browser — with one exception: the stateless [remote MCP endpoint](#remote-mcp-and-a2a-endpoints), which processes a request in transit and keeps nothing (the A2A endpoint described there is not deployed yet). The only other flows are the ones described below: anonymous analytics, and, if you configure them, requests to your chosen AI provider. So there is no Kaiord-held record of you. For GDPR purposes there is therefore no Kaiord-operated data controller. The maintainer (Pablo Albaladejo) is the point of contact for privacy inquiries; see the [Contact](#contact) section.

## Data Collection

We use Umami, a privacy-friendly, cookie-less analytics tool. It records anonymous page views and product events (e.g. 'workout exported'); never your workouts, health data or API keys. Umami runs on the website (kaiord.com), the documentation and the web editor. With each page view it also records the referring site and any UTM campaign tags in the link you followed, with no personal data. We do not use cookies for tracking.

All workout-editor state (workouts, templates, sport-zone profiles, AI provider keys, sync state, chat transcripts) is stored locally in your browser via IndexedDB (Dexie). Nothing is sent to a Kaiord-operated server, ever. This local data remains on your device until you remove it: clear AI provider keys via Settings → Privacy → Clear All API Keys, delete individual workouts via the per-workout delete action, clear a conversation via the assistant's Clear conversation action, or clear site data in your browser to remove everything at once.

If you configure the optional AI features inside the workout editor, your prompts and workout content are sent directly from your browser to the LLM provider you chose (Anthropic, OpenAI, or Google) and are subject to that provider's privacy policy and terms of service. Kaiord does not receive or relay this data. Your API key is stored in your browser (IndexedDB), obfuscated with a fixed key that ships in Kaiord's public code rather than truly encrypted, so any script running on kaiord.com (including the third-party scripts it loads, such as analytics), any browser extension allowed on kaiord.com, and anyone with access to your browser profile can read it. It is sent with each request to the provider you configured, never to Kaiord. If you turn on cross-device sync, a copy is included in the sync snapshot stored in your own Google Drive, encrypted with your passphrase only if you turned on sync encryption.

When you use the in-app chat assistant, summaries of your locally stored history — including workout, coaching, and health data such as sleep — are sent to the LLM provider you configured, and only while you are actively conversing with the assistant (never in the background). Your chat transcripts are stored locally in your browser like the rest of your editor state and, if you enable cross-device sync, are included in the encrypted snapshot saved to your own cloud storage; they are never sent to a Kaiord-operated server.

## Remote MCP and A2A Endpoints

`https://kaiord.com/mcp` is a stateless Model Context Protocol endpoint, hosted on Cloudflare Workers, that converts and inspects workout definitions an AI agent sends to it. Here is how it handles data:

- **Structured Workouts Only**: The endpoint accepts only structured workout definitions. Recorded activities, courses, and every health file type are rejected; a rejected file is decoded in memory only to learn its type, and is neither stored, logged nor returned.
- **Workout Content in Transit**: A workout's own content — its name, free-text notes, heart-rate targets and device metadata such as a serial number — is processed in transit, and may contain personal information if the caller puts it there.
- **Nothing Stored or Logged**: The content is processed only to answer that request and is never stored or logged. The endpoint has no database, no file storage and no request logs.
- **IP Address for Rate Limiting**: The client IP address is used transiently by the rate limiter and is not stored by Kaiord.
- **Cloudflare as Infrastructure Provider**: Requests travel through Cloudflare's network, which is the endpoint's network and hosting provider, subject to [Cloudflare's own privacy policy](https://www.cloudflare.com/privacypolicy/). Kaiord gives Cloudflare no other data.
- **No Garmin or Health Tools**: The endpoint offers no Garmin or health tools. Garmin Connect access and health data stay with the local `@kaiord/mcp` server and the browser extensions.

`https://kaiord.com/a2a` is an Agent2Agent (A2A) endpoint whose code is in the same Worker; it is not deployed yet, so nothing answers there today. Once deployed, it runs the same tools under the same terms described above, and its tasks finish inside the reply and are not retained.

## Kaiord for Garmin Extension

Kaiord for Garmin is the Chrome extension that connects the Kaiord App to Garmin Connect; its Chrome Web Store name is currently Kaiord Garmin Bridge. Here is how it handles data:

- **OAuth Token**: The extension mints an OAuth token by reusing your existing Garmin single-sign-on session: it exchanges that session for a short-lived service ticket, then for an OAuth1 token, kept until it stops working, and an OAuth2 access token that expires and is renewed with the OAuth1 token. It stores both in `chrome.storage.local` so it can call Garmin's API on your behalf across service-worker restarts. To mint them it uses the consumer key and secret of Garmin's mobile app as published by the open-source garth project, not a key Garmin issued to Kaiord.
- **Tokens Stay in Your Browser**: The tokens are sent only to Garmin, as a Bearer credential, and never travel to Kaiord: no answer the extension gives the Kaiord App contains one. Removing the extension from Chrome deletes them.
- **No Password**: The extension never reads, stores, or transmits your Garmin Connect password, and never sees it. Authentication reuses the session you already established by signing in to Garmin Connect in your browser.
- **Checking the Connection**: When the Kaiord App or the extension's popup checks the connection, the extension sends Garmin no request and mints no token: it answers only whether it holds Garmin access that has not expired. When it holds none, the answer is that it has not checked, and the first read or send finds out.
- **Workouts and Activities**: The extension uploads the workouts you send from the Kaiord App to your Garmin Connect workout library, lists up to 20 of your library workouts, and reads your 20 most recent activities, which it passes to the Kaiord App as Garmin returns them.
- **Body-Composition Upload**: When you send a measurement from the Kaiord App, the extension uploads a body-composition record (your weight plus derived metrics such as body-fat percentage) to Garmin Connect as a FIT file, using the `write:body` capability. It only ever sends the data you supply from the Kaiord App; it never reads your Garmin body-composition history.
- **Calendar Placement**: When you send workouts from the Kaiord App, the extension places each workout on its date in your Garmin Connect calendar (a calendar write). When a workout moves to another day, it adds the new calendar entry first and then deletes the old entry that Kaiord itself placed and has since superseded (a calendar delete). It deletes only entries that Kaiord's record holds as placed by Kaiord. An entry of that same workout that you added yourself is recognized, so no second one is added on its date, but it is never moved or deleted: when the workout moves on, Kaiord leaves it where it is and tells you once. It never deletes entries of other workouts, and never deletes library workouts.
- **Calendar Read, Filtered on Your Device**: The extension reads a month of your Garmin Connect calendar only while the Kaiord App sends or checks a workout: before placing it on a date, so no second entry is added there; when you send again a workout that has not changed, to check that its entry is still there; to confirm a placement Garmin did not clearly confirm; to check the calendar before removing an entry Kaiord replaced; and to re-check entries whose earlier removal did not complete. The read is filtered inside the extension's service worker: only the entries of the workout being placed (each entry's schedule id and date) reach the Kaiord App. The rest of your calendar (activities, other workouts, titles, metrics) is discarded on your device, and nothing is sent to a Kaiord-operated server.
- **Stored in Your Browser**: Besides the tokens, the extension keeps in `chrome.storage.local` the profile summary the Kaiord App sends for its popup, the app's theme preference, when it last could and could not read from Garmin, and a log of the last 25 errors it handled without failing.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with Garmin (`sso.garmin.com`, `connectapi.garmin.com`) and the Kaiord App (to exchange workout and body-composition data); `connect.garmin.com` is only opened in a tab for you to sign in.
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind. Its error log stays in your browser and is never sent.

## Kaiord for Train2Go Extension

Kaiord for Train2Go is the Chrome extension that lets the Kaiord App read your Train2Go coaching plan; its Chrome Web Store name is currently Kaiord Train2Go Bridge. Here is how it handles data:

- **Your Own Session**: The extension's service worker requests your data from `app.train2go.com` with `credentials: "include"`, so Chrome attaches your own Train2Go session cookie. It does not declare the `cookies` permission and cannot read that cookie. It injects no script into Train2Go pages and does not read them.
- **No Credentials**: The extension never reads, stores, or transmits your Train2Go password, and stores no cookie or token.
- **Read Only**: Every request is a `GET` to one of five allowlisted paths; a request outside them is refused before it is sent. The extension never changes anything on Train2Go: it does not modify the page, submit forms, or write to your account.
- **Coaching Plan**: When the Kaiord App asks, the extension reads the week your coach planned (each coaching activity's date, sport, title, duration, workload and completion status) and single days in full (the coach's description of each coaching activity, and that day's comments with who wrote them), and passes them to the Kaiord App.
- **Zones and Weight**: When the Kaiord App asks, the extension reads your Train2Go profile page and passes on only your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight. Gender, birthday, body fat, height, contact details, records and tests on that page are dropped inside the extension.
- **Checking the Connection**: When the Kaiord App checks the connection, the extension asks Train2Go who is signed in and passes on only whether you are. When you connect Train2Go in the Kaiord App, it passes on your Train2Go user id and name, your coach's name and the notes your coach keeps about you when Train2Go provides them. When you open the extension's popup, it reads the same to show your coach's name and notes, and also reads this week's plan to show its totals, at most once every 5 minutes unless you press Refresh.
- **Stored in Your Browser**: The extension keeps in `chrome.storage.local` only what its popup shows: the profile summary the Kaiord App sends for its popup, this week's totals, the app's theme preference, when it last could and could not read from Train2Go, and a log of the last 25 errors it handled without failing. Removing the extension from Chrome deletes them.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `app.train2go.com` (to read your data) and the Kaiord App (to pass it on), and sends nothing to a Kaiord-operated server.
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind. Its error log stays in your browser and is never sent.

## Kaiord for Tanita Extension

Kaiord for Tanita is the Chrome extension that connects the Kaiord App to your MyTANITA account at `mytanita.eu`; its extension name is currently Kaiord Tanita Bridge. Here is how it handles data:

- **No Password, No Cookie Access**: The extension never asks for, reads, stores, or transmits your MyTANITA password or any authentication token. It reuses your existing MyTANITA sign-in: its request is sent with `credentials:"include"`, so Chrome attaches MyTANITA's own HttpOnly `TANITASESS` session cookie. The extension does not declare the `cookies` permission and cannot read that cookie's value.
- **One Address, Your Whole Export**: The extension sends read-only requests to one fixed address, `https://mytanita.eu/en/user/export-csv`: a `GET` that downloads the export and a `HEAD` that checks the connection without downloading it; a request to any other path or with any other method is refused before it is sent. To the `GET`, MyTANITA answers with your whole body-composition history: every measurement your account holds, weight included. Only the `read:body` capability is declared.
- **Handed to the Kaiord App Unchanged**: When the Kaiord App asks for it, the extension passes the export on as raw text, without parsing it. The Kaiord App parses it in your browser and keeps the measurements there; nothing is sent to a Kaiord-operated server.
- **Checking the Connection Downloads Nothing**: Each time you open the extension's popup or press Refresh, and whenever the extension is asked whether it can reach MyTANITA, it sends a `HEAD` request for the export, which returns no measurement, and keeps only whether you are signed in. It reports you signed out only when MyTANITA sends it to the sign-in page.
- **Stored in Your Browser**: The extension keeps in `chrome.storage.local` only when its popup last could and could not reach your export, and the Kaiord App's theme preference. It never stores the export, a measurement, a cookie or a password. Removing the extension from Chrome deletes what it stored.
- **No mytanita.eu Page Access**: The extension injects no content script on `mytanita.eu`; it does not read or modify any MyTANITA page, and submits no form.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `mytanita.eu` (to check the connection and download your export) and the Kaiord App (to hand the export over).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord for TrainingPeaks Extension

Kaiord for TrainingPeaks is the Chrome extension that connects the Kaiord App to TrainingPeaks; its Chrome Web Store name is Kaiord TrainingPeaks Bridge. Here is how it handles data:

- **No Password**: The extension never asks for, reads, stores, or transmits your TrainingPeaks password. It reuses the session you already established by signing in to TrainingPeaks in your browser.
- **Access Token**: The extension exchanges your session cookie for a short-lived access token with a single cookie-only request, `GET https://tpapi.trainingpeaks.com/users/v3/token` (`credentials:"include"`, no `Authorization` header). The `Production_tpAuth` session cookie is a domain-wide `.trainingpeaks.com` cookie, so the browser attaches it to that request; the extension cannot read its value, because it does not declare the `cookies` permission. The extension keeps the token, the time it expires and your TrainingPeaks athlete number in `chrome.storage.local`.
- **Token Stays in Your Browser**: The token is sent only to TrainingPeaks, as a Bearer credential, and never travels to Kaiord: no answer the extension gives the Kaiord App contains it. Removing the extension from Chrome deletes it.
- **Checking the Connection**: When the Kaiord App or the popup checks your sign-in, the extension asks TrainingPeaks nothing and mints no token. It answers only whether it holds a token, minted for an earlier read or send, that has not expired; when it holds none, the answer is that it has not checked, and the first read or send finds out. It gives the Kaiord App your athlete number only just before placing a workout, which needs it.
- **Workouts**: The extension adds each workout you send from the Kaiord App to your TrainingPeaks calendar, on its day, with `POST /fitness/v6/athletes/{id}/workouts`. Before a workout is sent again, it reads the copy the Kaiord App sent earlier with `GET /fitness/v6/athletes/{id}/workouts/{workoutId}`, and passes the Kaiord App only that workout's id and day. It cannot delete anything in TrainingPeaks or change a workout already there: sending a changed workout again while its earlier copy is there adds a second copy, and the Kaiord App asks you first.
- **Body Metrics**: When the Kaiord App asks, the extension reads the metrics you logged in TrainingPeaks over a date range from `https://tpapi.trainingpeaks.com/metrics/v3/...` (the Kaiord App asks for the last 30 days) and passes the answer to the Kaiord App unread. The answer may include metrics other than weight, such as pulse, sleep or steps; the Kaiord App keeps only your weight. The extension also accepts a request to add one weight measurement, but the Kaiord App does not send it today. These are the `read:body`, `write:body` and `write:workouts` capabilities.
- **No TrainingPeaks Page Access**: The extension injects no content script on TrainingPeaks pages. Its service worker makes every request to a fixed list of `tpapi.trainingpeaks.com` paths; it does not modify any page or submit forms. Opening TrainingPeaks from the popup only opens `https://app.trainingpeaks.com/` in a new tab.
- **Stored in Your Browser**: Besides the token, the extension keeps in `chrome.storage.local` the app's theme preference and when the popup last could and could not use your TrainingPeaks sign-in.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `tpapi.trainingpeaks.com` and the Kaiord App (to pass it your metrics and the id and day of a workout it sent, and to receive the workouts you send).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Kaiord WHOOP Bridge Extension

The Kaiord WHOOP Bridge Chrome extension reads your WHOOP recovery, sleep, HRV, vitals, strain, stress, heart-rate, activity, and Advanced-Labs biomarker data and hands it to the Kaiord workout editor. This extension is not yet published to the Chrome Web Store. Here is how it handles data:

- **No OAuth, No Developer API Key, No Password**: The extension performs no OAuth flow, never asks for a WHOOP client id or secret, and never reads, stores, or transmits your WHOOP password. It piggybacks entirely on the session you already established by signing in to `app.whoop.com` in your browser, reusing the session bearer token that session already holds.
- **Three Session-Bearer Capture Paths**: The extension obtains that bearer in three ways, all of them local to your browser. (1) **In-flight header, page side** — a main-world script on `app.whoop.com` wraps `fetch` and `XMLHttpRequest` so it can read the `Authorization: bearer` header the WHOOP web app attaches to its own `api.prod.whoop.com` requests, and relays it through an isolated content script to the extension's background service worker. (2) **In-flight header, browser side** — the background service worker registers a `chrome.webRequest.onBeforeSendHeaders` listener scoped to `https://api.prod.whoop.com/*` and reads that same `Authorization` header directly, covering requests issued before the main-world script finished loading. The listener only reads headers; it never modifies, redirects, or blocks any request. (3) **Credential at rest** — on every `app.whoop.com` page load the isolated content script scans that origin's `localStorage` and, if WHOOP's own sign-in library has stored an access token under a `CognitoIdentityServiceProvider.<client-id>.accessToken` key, reads that stored value. This third path reads a credential your WHOOP session persisted rather than one in flight, and exists so the bridge works the moment the page loads instead of waiting for the WHOOP app to issue a request. No other `localStorage` key is read, and nothing in `localStorage` is written, modified, or removed.
- **Permissions Declared**: The extension declares four permissions: `tabs` (find an open `app.whoop.com` tab to relay reads through, and open WHOOP from the popup), `webRequest` (the read-only header capture path 2 above), `scripting` (re-inject its own bundled content scripts — including the main-world capture script — into `app.whoop.com` tabs that were already open when the extension was installed or updated; no remote code is ever fetched or executed), and `storage` (hold the captured bearer in memory-only session storage). It does **not** declare the `cookies` permission and therefore cannot read the value of any WHOOP cookie, and it declares no request-mutation permission (`webRequestBlocking`, `declarativeNetRequest*`), so it cannot alter, redirect, or block your traffic.
- **Memory-Only Token Storage**: The captured bearer is held only in `chrome.storage.session` (memory-only; cleared when the browser restarts) and is never logged — not even truncated — never written to disk, and never sent to a Kaiord-operated server. The token value itself is never handed to the Kaiord editor.
- **Your WHOOP Account Identifier**: The extension decodes the bearer's JWT payload locally to read its `custom:user_id` claim — your numeric WHOOP account identifier — because WHOOP's internal API requires it in the read paths. That identifier is stored beside the token in session storage and **is** returned to the Kaiord editor, but only when the editor is about to import your data (`read-user-id`). When the editor asks the extension for its status, the answer says only whether a session is captured: no identifier and no capture time.
- **Read-Only, Allowlisted Access**: The extension reads a fixed allowlist of WHOOP internal-API endpoints — cycle details (recovery/HRV, sleep, strain, workouts), heart-rate and other metric series, the sports catalog, Advanced-Labs biomarker tests, and daily stress — declaring the `read:body`, `read:sleep`, and `read:activities` capabilities. It exposes no write path to WHOOP. Every read is a `GET` issued from your open `app.whoop.com` tab carrying the captured bearer and `credentials:"include"`, so your own WHOOP session cookies are attached by the browser as usual; requests outside the allowlist, and any non-`GET` method, are rejected without a network call. The parsed response is returned to the Kaiord editor.
- **No Third-Party Sharing**: No data is shared with any third party. The extension only communicates with `app.whoop.com` / `api.prod.whoop.com` (to read your own WHOOP data) and allowed Kaiord origins (to deliver it to the editor).
- **No Telemetry**: The extension does not include any analytics, error reporting, or telemetry of any kind.

## Communication Scope

The extensions only communicate with the following domains:

- `https://sso.garmin.com/*` — Kaiord for Garmin exchanges your existing Garmin sign-in session for a short-lived service ticket (no password is entered or seen)
- `https://connectapi.garmin.com/*` — Kaiord for Garmin exchanges the ticket for an OAuth token and makes the workout/activity API calls with it
- `https://connect.garmin.com/*` — where you sign in to Garmin Connect; Kaiord for Garmin opens this page in a tab and sends it no request
- `https://app.train2go.com/*` — Kaiord for Train2Go's service worker reads your coaching plan, zones and weight with your existing session cookie; it runs no script on that domain
- `https://mytanita.eu/*` — Kaiord for Tanita downloads your MyTANITA export using your existing session cookie
- `https://tpapi.trainingpeaks.com/*` — Kaiord for TrainingPeaks' service worker exchanges your existing session cookie for a short-lived access token, reads your body metrics, adds the workouts you send and reads back one it sent before sending it again
- `https://app.whoop.com/*` — WHOOP Bridge's main-world and isolated content scripts capture the session bearer, both from the headers of the WHOOP web app's own requests and from the access token WHOOP's sign-in library stores in this origin's `localStorage`; the bridge also opens this page when you sign in
- `https://api.prod.whoop.com/*` — WHOOP Bridge relays allowlisted, read-only requests using that captured bearer, and reads (never modifies) the `Authorization` header of the WHOOP web app's own requests to this host via `chrome.webRequest`
- `https://kaiord.com/*` — the Kaiord editor (running on kaiord.com) sends messages **to** each extension via Chrome's `externally_connectable` channel. Each extension accepts that exact origin only, no subdomain (`www` included); a message from any other origin gets no answer. This is a one-way inbound channel: the extensions do not read the editor's DOM or cookies.

Each extension also injects a minimal **announce-only** content script (`kaiord-announce.js`) into `https://kaiord.com/*` only so the editor can discover which extension IDs are installed at runtime. This content script only calls `window.postMessage` to publish a fixed announcement object (bridge id, extension id, version, declared capabilities) and re-announces on request. It does **not** read the editor's DOM, cookies, storage, or network traffic, does **not** modify the page, and does **not** enable any inbound data path from kaiord.com into the extension beyond what `externally_connectable` already allows.

Each extension declares `host_permissions` limited to the hosts listed above — no wildcard or `<all_urls>` access.

No other domains are contacted in production builds. During local development, the extensions additionally accept messages from `http://localhost:5173` and `http://localhost:5174` (Vite dev server), and the announce-only content script is also injected on those two origins only (`http://localhost:5173/*` and `http://localhost:5174/*`, no other port) so locally-served editor builds can discover the extensions. These development-only matches are stripped from the production manifests (`manifest.prod.json`) before publishing to the Chrome Web Store.

## Regulatory Compliance

Because no personal data is retained server-side, there is no personal data held by us to protect, share, or delete. The remote MCP endpoint (kaiord.com/mcp), like the A2A endpoint (kaiord.com/a2a) once it is deployed, processes the client IP address for rate limiting, and any personal content a caller places in a workout, in transit only, and retains neither. This applies as long as Kaiord retains no personal data server-side (the state of the system today and at every release), under all applicable data protection regulations, including the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

You retain all data-subject rights under GDPR and CCPA (access, rectification, erasure, portability). Because Kaiord holds no records about you, a request would return nothing to act upon; if you believe data has been collected or processed in error, please contact us and we will investigate immediately.

## Children's Privacy

The Kaiord products are not directed at children under 13 (or under 16 in jurisdictions where that age applies), and we do not knowingly collect personal information from children. Because we do not collect personal data from anyone, this is trivially true, but we state it explicitly for clarity.

## Changes to this Policy

Material changes to this policy are announced through the project's GitHub release notes and reflected in the "Last updated" date above. This file lives under version control at [`packages/docs/legal/privacy-policy.md`](https://github.com/pablo-albaladejo/kaiord/blob/main/packages/docs/legal/privacy-policy.md); every change is visible via `git log`.

## Open Source

Kaiord is fully open source. You can inspect the complete source code, including both extensions, at [github.com/pablo-albaladejo/kaiord](https://github.com/pablo-albaladejo/kaiord).

## Contact

For privacy inquiries, please open an issue on the [GitHub repository](https://github.com/pablo-albaladejo/kaiord/issues) or contact the project maintainer, Pablo Albaladejo.
