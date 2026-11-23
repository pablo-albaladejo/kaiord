## Context

ADR 0004: "Checking whether there is a Session uses the cheapest request
there is. It never downloads the athlete's data and never mints a token; a
token is minted only when it is about to be used." The same ADR keeps the
popup's useful content and leaves undecided where it comes from. So the check
and the popup's display are split: the check is cheap and returns yes or no;
what a popup shows is an explicit read made when the athlete opens it.

## Decisions

### D1. The cheapest request, per Platform, from evidence in the repo

| Platform      | Before                                                                                                                          | After                                                                                                       | Evidence                                                                                                                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tanita        | `GET /en/user/export-csv`, whole history read, discarded                                                                        | `HEAD` of the same path, no body read                                                                       | The only path the extension calls; `docs/connectors-research/tanita.md` (200 with `Content-Type: application/csvm+json` signed in, 302 to `/en/user/login` without a session); the cookie does not authenticate the JSON API, and the extension has no `cookies` permission |
| TrainingPeaks | `GET /users/v3/token`, mints and stores a token, returns the athlete id                                                         | no request: a stored token minted by a real request that has not expired is `signed-in`, else `not-checked` | `docs/connectors-research/trainingpeaks.md`: the token endpoint is the only one the cookie authenticates, every other endpoint needs the Bearer it mints. No cheaper request exists                                                                                         |
| Garmin        | `GET /workout-service/workouts?start=0&limit=1`, minting or refreshing first when needed; the read result was handed to the App | no request: OAuth1 plus an OAuth2 that has not expired is `signed-in`, else `not-checked`                   | Any request needs a Bearer; refresh and mint issue credentials. The one-workout read downloads athlete data. `docs/connectors-research/garmin.md` lists no endpoint without a Bearer                                                                                        |
| Train2Go      | `GET /api/v2/profile/ping`, profile and coach notes handed to the App                                                           | same request, only the outcome leaves                                                                       | `docs/connectors-research/train2go.md` row 1: "Cheap auth/liveness probe"; the extension already calls it; `test/fixtures/ping-expired.json` is the verified signed-out answer                                                                                              |
| WHOOP         | no request; WHOOP id and capture time handed to the App                                                                         | no request; only `connected` and the outcome                                                                | Unchanged cost; reads need an open tab, so a request would need one                                                                                                                                                                                                         |

A `HEAD` was chosen for Tanita over a request to another page
(`/en/user/trends` would download a chart of the athlete's data) and over a
`Range` request (no evidence the PHP export honours it). Whether MyTANITA
accepts `HEAD` on the export is not verified without a real account; a 405
or any non-2xx, non-redirect answer maps to `not-answering`, never to
`signed-out`, so the failure mode is honest.

### D2. Four outcomes, not three

The ticket's three outcomes (signed in, signed out verified, could not tell)
leave one case unnamed: nothing was asked, because the only request that
could tell would mint a token. Reporting it as "could not tell, the Platform
did not answer" would state a cause nobody verified, and as "signed out"
would be false. It is `not-checked`, and the first real read or send finds
out. TrainingPeaks and Garmin hit it whenever no valid token is held; WHOOP
while no bearer is captured.

### D3. What each popup open requests

- **Tanita**: one `HEAD /en/user/export-csv`.
- **TrainingPeaks**: nothing (reads the stored token record).
- **Garmin**: nothing (stored tokens; the athlete card and last push come
  from `chrome.storage.local`). The library count row reads
  `gcApi.totalCount`, which no background ever produced; it is unchanged.
- **Train2Go**: `GET /api/v2/profile/ping` through `read-profile` (the
  athlete's name, the coach's name and notes it shows), and the week through
  `read-week` at most once every 5 minutes unless Refresh: the same requests
  as before, now an explicit read rather than the check.
- **WHOOP**: nothing (`popup-status` and `tab-open`, both internal).

### D4. Older extensions keep working

The App accepts the previous protocol: every reader falls back to the old
fields when `session` is absent, and each new explicit read falls back to the
old action when an older extension answers "Origin or action not
permitted". A new extension with an old App is not supported for the
TrainingPeaks send (the old App takes the athlete id from the check); the App
ships before an extension reaches the store, so the window is closed in
practice.

### D5. Tanita stays out of the App's probes

With the new extension a Tanita probe is cheap, but the App cannot tell an
older extension, whose `checkSession` downloads the export, before asking.
The `detail.installed` copy ("cannot re-check it without downloading your
whole export") is left to #1644, which owns the notices.

### D6. No wording of an existing notice changes

Only new keys are added where a state is new: `detail.notChecked` in the App
(en, es) and `notChecked` / `notCheckedCause` in the Garmin and
TrainingPeaks popups. #1644 folds them into its single wording.
