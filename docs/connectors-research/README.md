# Connector research — auth, session renewal & endpoints

Research (web + GitHub, July 2026) into every fitness-platform connector, focused on
two questions per platform:

1. **Session renewal** — how to keep a captured session alive **without re-login**,
   reusing only the user's own authentication (no registered developer app).
2. **Endpoint catalog** — what data can be **read and written** on each server.

Per-platform deep reports: [garmin](./garmin.md) · [whoop](./whoop.md) ·
[trainingpeaks](./trainingpeaks.md) · [strava](./strava.md) · [train2go](./train2go.md) ·
[tanita](./tanita.md).

> All findings are from reusing the **user's own session** (browser extension) or, for
> Tanita's backend, the user's own credentials. No developer/partner API registration is used
> anywhere. Several paths reverse-engineer private APIs — fragile and, for Strava, against ToS.

---

## Portfolio map

| Connector             | Context                      | Credential                                                             | Transport (SW-direct)                     | Relay/tab needed? | Verified           |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- | ----------------- | ------------------ |
| **Garmin**            | kaiord bridge                | OAuth Bearer **minted** from SSO session                               | `Bearer` + `credentials:omit`             | ❌ no             | shipped (PR #952)  |
| **Whoop**             | kaiord bridge                | Cognito Bearer **captured** from session                               | `Bearer` + `credentials:omit`             | ❌ no             | probe 200          |
| **TrainingPeaks**     | _(would-be)_                 | cookie `Production_tpAuth` → mints Bearer                              | `GET /users/v3/token` (cookie) → `Bearer` | ❌ no             | probe (see note)   |
| **Strava**            | _(would-be)_                 | cookie `_strava4_session` (+ `strava_remember_token`)                  | `credentials:include`                     | ❌ no             | probe 200 · ⚠️ ToS |
| **Train2Go**          | kaiord bridge                | cookie `train2go_session` (+ `remember_web`)                           | `credentials:include`                     | ❌ no             | probe 200          |
| **Tanita (web)**      | _(would-be)_                 | cookie `TANITASESS` → **`GET /en/user/export-csv`** (full-history CSV) | `credentials:include`                     | ❌ no             | probe 200 ✓        |
| **Tanita (JSON API)** | tanita-to-garmin-cdk backend | JWT via email+password login                                           | `Application-Authorization: Bearer`       | N/A (backend)     | shipped            |

**Key empirical finding:** for a **Chrome MV3 extension service worker with `host_permission` +
`credentials:"include"`, the session cookie travels regardless of `SameSite` (Lax or None)** —
confirmed on TrainingPeaks, Strava, and Train2Go. `SameSite` is _not_ the gate; the real gate is
each API's own auth logic. Token-based connectors (Garmin, Whoop) sidestep cookies entirely with
`credentials:"omit"`.

---

## Session renewal cheatsheet (how to avoid re-login)

| Connector             | Durable credential                                                    | Self-renewal mechanism                                                                               | Autonomous?                         | Re-login only when…                                           |
| --------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| **Garmin**            | OAuth1 (~1 yr)                                                        | refresh OAuth2 via OAuth1 (`POST oauth-service/oauth/exchange`); re-mint from session if OAuth1 dies | ✅ (ext.)                           | Garmin logout (ext. re-mints silently); backend re-seed ~1/yr |
| **Whoop**             | Cognito **refresh token** (~30 d, in `localStorage`, **not rotated**) | `POST cognito-idp.us-west-2.amazonaws.com` `InitiateAuth REFRESH_TOKEN_AUTH` → fresh Bearer, no tab  | ✅ (reachable)                      | refresh token expires (~30 d) or revoked                      |
| **TrainingPeaks**     | cookie `Production_tpAuth` (~weeks, ASP.NET forms, sliding)           | cookie → `GET /users/v3/token` → fresh 1 h Bearer; browser keeps cookie                              | ✅ (while cookie lives)             | cookie expires after long inactivity                          |
| **Strava**            | `strava_remember_token` (JWT)                                         | browser re-mints `_strava4_session` from the remember JWT                                            | ✅ (with "remember me")             | logout / password change · ⚠️ ToS                             |
| **Train2Go**          | `remember_web` (Laravel, **~5 yr** default)                           | Laravel silently re-auths when the 2 h session lapses                                                | ✅ (browser handles it)             | explicit logout / password change                             |
| **Tanita (web)**      | cookie `TANITASESS` (24 h)                                            | slides if the app re-issues it on each request; "Remember my login" may add a persistent cookie      | ~ (needs sliding / remember cookie) | 24 h idle without a remember cookie                           |
| **Tanita (JSON API)** | email + password (**no refresh token**)                               | re-login `POST /de/api/login` (CORS `*`) on 401                                                      | needs stored password               | —                                                             |

- **garth is DEPRECATED (2026-03)** — use `cyberjunky/python-garminconnect` (native auth) for Garmin.
- **Whoop refresh** works because the web app uses a **public** Cognito client (no secret) — call Cognito directly. Mobile uses a confidential client via a UA-gated proxy `POST /auth-service/v3/whoop/`.
- **TrainingPeaks:** the captured Bearer is _not_ a red herring — you must **mint a fresh one** from the cookie via `/users/v3/token` (cookie-only, no `Authorization`), then use that Bearer for all data endpoints.

---

## Key write endpoints (the useful ones)

- **Garmin — body composition:** `POST /upload-service/upload` (multipart FIT `weight_scale` message: weight, fat%, hydration, visceral fat, bone mass, muscle mass, BMR, physique rating, metabolic age, BMI). Simple weight only: `POST /weight-service/user-weight`. → **the Tanita→Garmin path.**
- **TrainingPeaks — metrics:** `POST /metrics/v3/athletes/{aid}/consolidatedtimedmetric` (**type 9 = weight**, HRV=60, sleep=6, …). Workouts: `POST /fitness/v6/athletes/{aid}/workouts` (planned) + `POST …/workouts/{id}/filedata` (completed FIT/TCX/GPX/PWX).
- **Tanita — read (no password):** `GET /en/user/export-csv` with the web session cookie → **full-history CSV, 28 columns incl. segmentals** (richer than the JSON API, no stored credentials). JSON API alternative (needs password): `GET /de/api/measurements` (37 indicators), write via `POST /de/api/measurements` (delta-sync, unverified). Full catalog + the export-csv finding in [tanita.md](./tanita.md).
- **Whoop:** rich internal writes (log workout, journal, alarms) but **no body-weight write**. Official API is read-only.
- **Strava:** no clean internal upload — activity upload needs the official `POST /api/v3/uploads` (registered app, off-table); web session is best for **reads/exports**. ⚠️ **ToS crackdown June 2026.**
- **Train2Go:** writes = day comments (`POST/DELETE /api/v2/comments`), zones/thresholds; no native activity-upload (completion arrives via Strava webhook).

---

## Provenance

- Generated July 2026 from parallel web + GitHub research agents, cross-checked against live black-box probes (no credentials used) and the kaiord bridge source.
- Private/reverse-engineered APIs change without notice; treat paths as observed-at-time, not contracts. Re-verify before building.
- Full repo lists, endpoint tables, gotchas, and sources are in the six per-platform files linked at the top.
