# Garmin push — guided smoke test (F0.1)

This is the manual smoke checklist for diagnosing the kaiord → Garmin Connect
push. It exists because the push may be broken (user report) and no automated
test can exercise a real Garmin Connect session — someone has to click
through it with a real account. Do this **before** building anything on top
of the push path (F3's `push_to_garmin` tool, F4.1's Garmin health import) —
both share the same browser-extension mechanism this checklist exercises.

## The path this checklist covers

There are **two independent push paths** in this repo. This checklist is
about the first one only:

1. **SPA → Garmin Bridge extension (this checklist)** — the workout editor
   (`packages/workout-spa-editor`) calls `exportGcnWorkout()`
   (`src/utils/export-workout-formats.ts`), then
   `useGarminBridge().pushWorkout(gcn)`
   (`src/hooks/use-garmin-bridge-action-helpers.ts` → `runPush`), which
   sends a `{ action: "push", gcn }` message to the installed
   `@kaiord/garmin-bridge` Chrome extension. The extension's service worker
   (`packages/garmin-bridge/background.js`, `pushWorkout()`) relays it to a
   content script running on an open `connect.garmin.com` tab
   (`content.js`), which does the actual `fetch` with the page's session
   cookies + captured CSRF token against
   `POST /workout-service/workout`.
2. **CLI/MCP → Garmin Connect (NOT covered here)** — `@kaiord/garmin-connect`
   (`src/adapters/client/garmin-workout-service.ts`) pushes via an
   injected OAuth `GarminHttpClient`. No browser extension involved. If the
   CLI push works but the SPA push doesn't (or vice versa), that tells you
   the bug is in one path's mechanism, not in Garmin's API itself.

## Prerequisites

- Chrome (or Chromium-based browser) with Developer mode available.
- A real Garmin Connect account, logged in.
- The Kaiord SPA running locally (`pnpm --filter @kaiord/workout-spa-editor dev`)
  or against the deployed instance.
- At least one workout in the editor to push.

## Setup

1. `chrome://extensions/` → enable **Developer mode** → **Load unpacked** →
   select `packages/garmin-bridge/`.
2. Note the extension ID shown under the extension name — you'll need it if
   you want to inspect its storage/logs directly (see "Troubleshooting"
   below).
3. Open `https://connect.garmin.com/modern/` in a tab and make sure you're
   logged in. Leave this tab open — the bridge relays through it.
4. In the extension popup, confirm the status pill reads **"Connected to
   Garmin Connect"**. If it doesn't, stop here — the CSRF/session capture
   itself is broken, and the push will fail for that reason (see
   Troubleshooting → "Not connected").

## Enable the push affordance in the SPA

The **Send to Garmin** button only renders when a workout **export
policy** to the Garmin bridge is enabled — otherwise it's honestly hidden
rather than shown-then-failing.

1. In the SPA, go to **Profile → Data Flows → Destinations**.
2. Add (or verify) a destination policy for **workouts → Garmin Connect**
   and make sure it's enabled.
3. Reload the editor. The extension popup should also show `sessionActive`;
   if the SPA doesn't detect the extension at all, re-check
   `externally_connectable` in `packages/garmin-bridge/manifest.json`
   matches the SPA origin you're running (`localhost:5173`/`5174` or
   `*.kaiord.com`).

## Smoke steps

1. Open (or create) a workout in the editor.
2. Confirm the **Send to Garmin** button is visible and enabled (not the
   disabled "Garmin (no session)" state).
3. Click **Send to Garmin**.
4. **Expected on success**: the button area shows "Sent to Garmin" and the
   workout appears in Garmin Connect's workout library within a few
   seconds.
5. **On failure**: an inline error message with a concrete cause appears
   next to the button — e.g. `Push failed: 403`, `Extension did not
respond. Check Garmin Connect before retrying.`, or
   `Blocked: disallowed path or method`. This message is now shown even if
   the failure caused the session to flip to "no session" (F0.3 fix) — it
   should never look like nothing happened.

Record the exact message from step 5 — it is the primary diagnostic signal.

## Troubleshooting — reading the telemetry (F0.2)

A few failure paths in the bridge are intentionally swallowed (so one bad
tab or a transient hiccup doesn't break the whole extension) but now record
a structured, capped log (last 25 entries) in `chrome.storage.local` under
the key `bridgeTelemetry`. Each entry is `{ level, action, cause, at }`.

To inspect it:

1. `chrome://extensions/` → find **Kaiord Garmin Bridge** → click
   **service worker** (under "Inspect views") to open its devtools.
2. In the console, run:
   ```js
   chrome.storage.local.get("bridgeTelemetry").then(console.log);
   ```
3. Look at the most recent entries' `action` field:
   - `reinject-content-script` — the extension couldn't re-inject
     `content.js` into an already-open Garmin tab after a reload. `cause`
     has the underlying Chrome error. Fix: reload the Garmin Connect tab.
   - `load-profile-snapshot` at `level: "error"` — the bundled
     `profile-snapshot.js` failed to load inside the packaged extension
     (not the expected Node/test fallback). This points at a build/packaging
     problem, not a Garmin API issue.

The same mechanism exists in `@kaiord/train2go-bridge` (`ping` and
`reinject-content-script` actions) for the equivalent Train2Go issues.

## Common causes and what they mean

| Symptom                                                            | Likely cause                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Popup shows "Not connected"                                        | No CSRF token captured yet, or no `connect.garmin.com` tab open. Reload the Garmin tab.    |
| `Push failed: 401` / `403`                                         | Garmin session expired. Re-login on `connect.garmin.com`, then retry.                      |
| `Blocked: disallowed path or method`                               | `content.js`'s allowlist rejected the request — a real bug if the path is expected.        |
| `Extension did not respond. Check Garmin Connect before retrying.` | The service worker didn't answer in time (cold start) or the tab was closed mid-request.   |
| Button never appears                                               | No enabled workout export policy to the Garmin bridge (see "Enable the push affordance").  |
| "Extension was updated. Please try again."                         | Extension context was invalidated (reloaded) mid-push; retry after the automatic redetect. |

## After the smoke

Write the outcome (pass/fail, exact error message, matching telemetry
entries if any) to `.omc/notepad.md` before building anything gated on this
diagnosis (F4.1 — Garmin health import shares this same session mechanism).
