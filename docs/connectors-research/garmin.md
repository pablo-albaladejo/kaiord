# Garmin

Deep research on the Garmin Connect integration ecosystem, focused on (1) how existing
libraries keep the session alive without re-login, and (2) the concrete `connectapi.garmin.com`
endpoint catalog (read + write), including the weight/body-composition upload path relevant to a
Tanita to Garmin flow.

The mobile-SSO OAuth flow itself (OAuth1 ~1yr -> short-lived OAuth2 Bearer) is taken as known and
not re-derived here.

---

## Repos & maintenance

| Repo                                                                                                                                                                                    | Lang    | Stars | Last activity        | Status                              | Notes                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- | -------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [cyberjunky/python-garminconnect](https://github.com/cyberjunky/python-garminconnect)                                                                                                   | Python  | ~2.6k | 2026-07 (active)     | **Actively maintained**             | The de-facto reference client. Latest versions **dropped the `garth` dependency** for a native auth engine (mobile SSO + `diauth.garmin.com`). Widest endpoint coverage incl. `add_body_composition` FIT upload.                            |
| [matin/garth](https://github.com/matin/garth)                                                                                                                                           | Python  | ~815  | 2026-03 final commit | **DEPRECATED** (v0.8.0, 2026-03-28) | The canonical token/session engine everyone copied. Still the best-documented reference for OAuth1/OAuth2 dump/load. Existing saved sessions keep working until the OAuth1 token expires (~1yr); new logins broken by a Garmin auth change. |
| [Pythe1337N/garmin-connect](https://github.com/Pythe1337N/garmin-connect) (npm `garmin-connect`)                                                                                        | TS/JS   | ~193  | npm 1.6.2, 2024-01   | **Stale**                           | Original JS client. Clean `UrlClass.ts` endpoint map. `updateWeight` + `uploadActivity`. Not updated for recent auth changes.                                                                                                               |
| [florianpasteur/garmin-connect](https://github.com/florianpasteur/garmin-connect) (npm `@flow-js/garmin-connect`)                                                                       | TS/JS   | fork  | npm 1.6.17, 2026-06  | **Maintained fork**                 | Actively-maintained drop-in fork of Pythe1337N; use this for JS/TS instead of the stale original.                                                                                                                                           |
| [tcgoetz/GarminDB](https://github.com/tcgoetz/GarminDB)                                                                                                                                 | Python  | ~3.2k | 2026-07 (active)     | Active                              | Download/analyze into SQLite; uses `garth` under the hood for auth. Read-only oriented.                                                                                                                                                     |
| [abrander/garmin-connect](https://github.com/abrander/garmin-connect)                                                                                                                   | Go      | ~153  | 2026-04              | Semi-active                         | Go client, reverse-engineered API incl. weight upload.                                                                                                                                                                                      |
| [10REM/php-garmin-connect](https://github.com/10REM/php-garmin-connect)                                                                                                                 | PHP     | ~85   | 2026-04              | Semi-active                         | PHP adapter.                                                                                                                                                                                                                                |
| [RobertWojtowicz/export2garmin](https://github.com/RobertWojtowicz/export2garmin)                                                                                                       | Python  | ~266  | 2026-07              | Active                              | Mi/Omron scale -> Garmin body-composition; real-world weigh-in upload example.                                                                                                                                                              |
| [Nicolasvegam/garmin-connect-mcp](https://github.com/Nicolasvegam/garmin-connect-mcp)                                                                                                   | Python  | ~161  | 2026-07              | Active                              | MCP server wrapping python-garminconnect (61 tools).                                                                                                                                                                                        |
| [davidkroell/bodycomposition](https://github.com/davidkroell/bodycomposition) / [marcelorodrigo/garmin-connect-weight-api](https://github.com/marcelorodrigo/garmin-connect-weight-api) | Go / JS | small | 2025-26              | Niche                               | Purpose-built body-composition FIT builders + upload — directly analogous to a Tanita flow.                                                                                                                                                 |

**Bottom line:** for a production Tanita->Garmin backend, track **cyberjunky/python-garminconnect**
(active, native auth, has the weight FIT-upload path). Use **garth** only as the reference spec for
token serialization. For JS/TS use the **@flow-js** fork, not the stale original.

---

## Session persistence & renewal

The universal model (garth-derived, copied by nearly everyone): **persist two tokens, refresh the
short one on demand, never re-login until the long one dies.**

### Token model (garth `auth_tokens.py`)

- **OAuth1Token**: `oauth_token`, `oauth_token_secret`, optional `mfa_token` + `mfa_expiration_timestamp`, `domain`. This is the long-lived credential (**~1 year**). Minted once via the SSO ticket at `oauth-service/oauth/preauthorized`.
- **OAuth2Token**: `access_token`, `refresh_token`, `token_type` (Bearer), `scope`, `jti`, plus computed `expires_at` / `refresh_token_expires_at`. Short-lived Bearer used as the `Authorization` header against `connectapi`. Has `.expired` and `.refresh_expired` properties comparing `expires_at` to `time.time()`.

### Serialize / store

garth `Client` (`http.py`):

- `dump(dir_path)` -> writes two files: **`oauth1_token.json`** and **`oauth2_token.json`** (JSON via `asdict`, indent 4). `dump(dir, oauth2_only=True)` writes only the refreshable one.
- `dumps()` -> returns a **single base64 string** (both tokens serialized together) — convenient for storing in one env var / secret. `loads(str)` restores it.
- `load(dir_path)` / `loads(str)` -> restore.
- Env-var auto-resume (`_auto_resume` in constructor via `GarthSettings`, env prefix `GARTH_`):
  - **`GARTH_HOME`** = directory holding the two token files (loaded on client init; refreshed OAuth2 is written back here, keeping the session current).
  - **`GARTH_TOKEN`** = the base64 blob from `dumps()`.
  - `GARTH_HOME` and `GARTH_TOKEN` are **mutually exclusive** (raises if both set).
- Consumer key/secret are fetched from `https://thegarth.s3.amazonaws.com/oauth_consumer.json` (Android app consumer). User-Agent spoofs the app: `com.garmin.android.apps.connectmobile` for SSO, `GCM-iOS-5.22.1.4` for API.

cyberjunky (native engine, current):

- Stores a **single** `~/.garminconnect/garmin_tokens.json` (file mode **0600**). `Garmin(..., tokenstore=path)` or env **`GARMINTOKENS`** selects the location. `login(tokenstore)` loads cached tokens first and short-circuits the login chain if they load.
- OAuth2 obtained via **`diauth.garmin.com`** (DI OAuth Bearer: `access_token` + `refresh_token`) in the native engine, vs garth's `connectapi.../oauth-service/oauth/exchange/user/2.0`.

### OAuth2 refresh (the "keep alive" mechanism)

garth `http.request()` (called on every API request with `api=True`):

```
if oauth2_token is not OAuth2Token or oauth2_token.expired:
    self.refresh_oauth2()          # -> sso.exchange(oauth1_token, self)
headers["Authorization"] = str(oauth2_token)   # "Bearer <access_token>"
```

`refresh_oauth2()` re-runs `sso.exchange()`: **POST `connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0`**, signed with the OAuth1 token (via `requests_oauthlib.OAuth1Session`), form-encoded; if an `mfa_token` is present it's included. Response yields a fresh OAuth2 token; `set_expirations()` stamps `expires_at`/`refresh_token_expires_at`. **No credentials or MFA are needed for refresh — only the still-valid OAuth1 token.** cyberjunky's README states DI tokens "auto-refresh indefinitely as long as the refresh token remains valid"; full re-login only if the long token expires/revokes.

### MFA handling

garth `sso.login(..., return_on_mfa=False, prompt_mfa=lambda: input("MFA code: "))`:

- If SSO responds `MFA_REQUIRED`, and `return_on_mfa=True` (or `prompt_mfa=None`), it returns `("needs_mfa", client_state)` so a server can prompt asynchronously, then call **`resume_login(client_state, mfa_code)`** — the split-flow API for non-interactive/headless backends.
- MFA is verified at **POST `/mobile/api/mfa/verifyCode`** (`mfaMethod`, `mfaVerificationCode`). The resulting OAuth1 carries an `mfa_token` so subsequent OAuth2 refreshes don't re-prompt.
- cyberjunky mirrors this: `resume_login()` + `prompt_mfa` callback.

### Practical persistence pattern (for a Lambda/CDK backend)

1. Interactive login once (with MFA) -> `dumps()` / `garmin_tokens.json`.
2. Store the blob in a secret (Secrets Manager). This matches the project's existing "re-seed tokens ~July 2027" note.
3. On each run: load tokens, let the client auto-refresh OAuth2 against `oauth-service/oauth/exchange/user/2.0` (or `diauth`). Write the refreshed OAuth2 back to the secret so `expires_at` stays current.
4. Re-seed only when the OAuth1 (~1yr) expires.

---

## Endpoint catalog

Base host: **`https://connectapi.garmin.com`** (garth/cyberjunky call it `connectapi`; the JS
`UrlClass` builds `https://connectapi.${domain}`). Older paths route via
`connect.garmin.com/modern/proxy`. All require the OAuth2 `Authorization: Bearer` header.
`{dn}` = user `displayName`; `{d}` = date `YYYY-MM-DD`.

| Method   | Path                                                                                                        | Data                                                          | R/W   |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| GET      | `/userprofile-service/socialProfile`                                                                        | User profile (displayName, userName)                          | R     |
| GET      | `/userprofile-service/userprofile/user-settings`                                                            | Unit system, user settings                                    | R     |
| GET      | `/usersummary-service/usersummary/daily/{dn}?calendarDate={d}`                                              | Daily summary (steps, calories, distance, floors)             | R     |
| GET      | `/usersummary-service/stats/steps/daily/{start}/{end}`                                                      | Daily steps range                                             | R     |
| GET      | `/usersummary-service/usersummary/hydration/allData/{d}`                                                    | Hydration                                                     | R     |
| GET      | `/wellness-service/wellness/dailyHeartRate/{dn}?date={d}`                                                   | Heart-rate day detail                                         | R     |
| GET      | `/wellness-service/wellness/dailySleepData/{dn}?date={d}` (JS: `/sleep-service/sleep/dailySleepData`)       | Sleep stages/duration                                         | R     |
| GET      | `/wellness-service/wellness/dailyStress/{d}`                                                                | All-day stress                                                | R     |
| GET      | `/wellness-service/wellness/daily/spo2/{d}`                                                                 | Pulse ox / SpO2                                               | R     |
| GET      | `/wellness-service/wellness/daily/respiration/{d}`                                                          | Respiration                                                   | R     |
| GET      | `/wellness-service/wellness/bodyBattery/reports/daily/...`                                                  | Body Battery                                                  | R     |
| GET      | `/hrv-service/hrv/{d}`                                                                                      | HRV                                                           | R     |
| GET      | `/metrics-service/metrics/maxmet/daily/{d}/{d}`                                                             | VO2max / max metrics                                          | R     |
| GET      | `/metrics-service/metrics/trainingreadiness/{d}`                                                            | Training readiness                                            | R     |
| GET      | `/userstats-service/wellness/daily/{dn}?fromDate=&untilDate=`                                               | Resting HR                                                    | R     |
| GET      | `/biometric-service/stats/lactateThreshold*/range/{start}/{end}`                                            | Lactate threshold (HR/speed/power)                            | R     |
| **GET**  | **`/weight-service/weight/dateRange?startDate=&endDate=`**                                                  | **Body composition (fat%, muscle, bone, BMI)**                | **R** |
| **GET**  | **`/weight-service/weight/range/{start}/{end}`**                                                            | **Weigh-ins in range**                                        | **R** |
| **GET**  | **`/weight-service/weight/dayview/{d}`**                                                                    | **Daily weigh-in**                                            | **R** |
| GET      | `/activitylist-service/activities/search/activities?start=&limit=&activityType=`                            | List activities                                               | R     |
| GET      | `/activity-service/activity/{activityId}`                                                                   | Activity detail                                               | R     |
| GET      | `/activity-service/activity/activityTypes`                                                                  | Activity type catalog                                         | R     |
| GET      | `/activity-service/activity/{id}/splits` \| `/weather` \| `/exerciseSets`                                   | Activity sub-resources                                        | R     |
| GET      | `/fitnessstats-service/activity`                                                                            | Count activities                                              | R     |
| GET      | `/download-service/files/activity/{activityId}`                                                             | Download original (FIT, zip)                                  | R     |
| GET      | `/download-service/export/{gpx\|tcx\|kml}/activity/{activityId}`                                            | Export GPX/TCX/KML                                            | R     |
| GET      | `/workout-service/workouts?start=&limit=`                                                                   | List workouts                                                 | R     |
| GET      | `/workout-service/workout/{workoutId}`                                                                      | Workout detail                                                | R     |
| GET      | `/gear-service/gear/{userProfilePk}` \| `/gear/stats/{uuid}`                                                | Gear + stats                                                  | R     |
| GET      | `/device-service/deviceregistration/devices`                                                                | Registered devices                                            | R     |
| **POST** | **`/upload-service/upload`** (multipart `file=`; also `/upload/.{fit\|tcx\|gpx}` in JS)                     | **Upload activity FIT/TCX/GPX; ALSO body-composition `.fit`** | **W** |
| **POST** | **`/weight-service/user-weight`** (JSON: `value`, `unitKey`, `dateTimestamp`, `gmtTimestamp`, `sourceType`) | **Add a weigh-in (simple weight, no composition)**            | **W** |
| POST     | `/workout-service/workout`                                                                                  | Create workout                                                | W     |
| PUT      | `/usersummary-service/usersummary/hydration/log`                                                            | Log hydration                                                 | W     |
| POST     | `/wellness-service/wellness/dailyBloodPressure` (cyberjunky blood-pressure endpoint)                        | Add blood pressure                                            | W     |
| DELETE   | `/activity-service/activity/{activityId}`                                                                   | Delete activity                                               | W     |
| DELETE   | `/workout-service/workout/{workoutId}`                                                                      | Delete workout                                                | W     |
| DELETE   | `/weight-service/weight/{d}/byversion/{samplePk}`                                                           | Delete weigh-in                                               | W     |

### The two weight write paths (key for Tanita)

1. **Full body composition** -> cyberjunky `add_body_composition(...)`: builds a **`.fit` file** with a
   _weight_scale_ message (weight, percent_fat, percent_hydration, visceral_fat_mass, bone_mass,
   muscle_mass, basal_met, active_met, physique_rating, metabolic_age, visceral_fat_rating, bmi)
   via a `FitEncoderWeight`, then **POST multipart to `/upload-service/upload`**. This is the path
   that carries Tanita's fat%/muscle/bone/water fields. (Same approach: davidkroell/bodycomposition,
   marcelorodrigo/garmin-connect-weight-api, RobertWojtowicz/export2garmin.)
2. **Weight only** -> cyberjunky `add_weigh_in()` / JS `updateWeight()`: **POST JSON to
   `/weight-service/user-weight`** with `{value, unitKey:"kg", dateTimestamp, gmtTimestamp,
sourceType:"MANUAL"}`. Simpler but carries no body-composition fields — insufficient for full
   Tanita data.

Auth endpoints (for completeness): `POST https://sso.garmin.com/sso/signin` (login) ->
`GET connectapi.garmin.com/oauth-service/oauth/preauthorized?ticket=...&accepts-mfa-tokens=true`
(mint OAuth1) -> `POST connectapi.garmin.com/oauth-service/oauth/exchange/user/2.0` (OAuth1->OAuth2,
also the refresh call; cyberjunky native uses `diauth.garmin.com`) -> MFA at
`POST /mobile/api/mfa/verifyCode`.

---

## Gotchas

- **garth is deprecated (2026-03).** New logins are broken by a Garmin auth change; only pre-existing
  saved sessions keep working until the OAuth1 token expires (~1yr). Don't build new code on garth —
  use cyberjunky's native engine or copy garth's token logic.
- **Login rate limiting (HTTP 429).** Garmin aggressively rate-limits the _login/SSO_ endpoint.
  Repeatedly logging in (e.g. a Lambda that logs in fresh every invocation) triggers 429s and
  temporary IP/account blocks (cyberjunky issues [#213](https://github.com/cyberjunky/python-garminconnect/issues/213), [#332](https://github.com/cyberjunky/python-garminconnect/issues/332)). **Persist tokens and refresh OAuth2 instead of re-login.** Refresh (`oauth-service/oauth/exchange`) is not the bottleneck; the SSO signin is.
- **"OAuth1 token is required for OAuth2 refresh"** ([#312](https://github.com/cyberjunky/python-garminconnect/issues/312)): on MFA accounts, if only the OAuth2 token is persisted (not OAuth1), the refresh fails — you must store **both** tokens. Store the full blob, not just the Bearer.
- **MFA in headless/serverless:** use the split flow (`return_on_mfa=True` -> `resume_login`), and once you have an `mfa_token`-bearing OAuth1, subsequent refreshes are non-interactive. Interactive MFA cannot happen inside an unattended Lambda — seed tokens out-of-band.
- **Stale/poisoned cached tokens:** cyberjunky now self-heals (discards API-rejected cached tokens and re-logs in); older versions failed every run. Provide `logout()` / clear the token store if you hit persistent auth failures. Region/account conditions can make one login strategy return a token the API later rejects — hence `verify_login`.
- **Unofficial API:** all of this is reverse-engineered mobile-app traffic, not a supported API. Paths and the consumer key can change without notice; spoofed User-Agent headers (`com.garmin.android.apps.connectmobile`, `GCM-iOS-5.22.1.4`) matter. Garmin's _official_ partner API (Health/Activity API, `apis.garmin.com`) is separate, OAuth2-consumer based, and requires an approved developer program — not what these libraries use.
- **JS original is stale:** `Pythe1337N/garmin-connect` (npm 1.6.2, 2024) predates recent auth changes; prefer `@flow-js/garmin-connect` (npm 1.6.17, 2026).
- **Body-composition upload requires a valid FIT weight_scale message.** A hand-rolled FIT with wrong field scaling silently imports garbage; reuse a proven encoder (cyberjunky `FitEncoderWeight`, or Garmin's FIT SDK) rather than crafting bytes.

---

## Sources

- garth (source): https://github.com/matin/garth — `src/garth/http.py`, `src/garth/sso.py`, `src/garth/auth_tokens.py`, `README.md`
- garth docs: https://garth.readthedocs.io/ ; PyPI: https://pypi.org/project/garth/
- cyberjunky/python-garminconnect: https://github.com/cyberjunky/python-garminconnect — `garminconnect/__init__.py`, `README.md`
  - Issue #213 (login rate limit): https://github.com/cyberjunky/python-garminconnect/issues/213
  - Issue #312 (OAuth1 required for refresh): https://github.com/cyberjunky/python-garminconnect/issues/312
  - Issue #332 (auth API change): https://github.com/cyberjunky/python-garminconnect/issues/332
- Pythe1337N/garmin-connect: https://github.com/Pythe1337N/garmin-connect — `src/garmin/UrlClass.ts`, `src/garmin/GarminConnect.ts`
- @flow-js/garmin-connect (maintained fork): https://www.npmjs.com/package/@flow-js/garmin-connect ; https://github.com/florianpasteur/garmin-connect
- tcgoetz/GarminDB: https://github.com/tcgoetz/GarminDB
- abrander/garmin-connect (Go): https://github.com/abrander/garmin-connect
- 10REM/php-garmin-connect: https://github.com/10REM/php-garmin-connect
- RobertWojtowicz/export2garmin (scale->Garmin body comp): https://github.com/RobertWojtowicz/export2garmin
- davidkroell/bodycomposition: https://github.com/davidkroell/bodycomposition
- marcelorodrigo/garmin-connect-weight-api: https://github.com/marcelorodrigo/garmin-connect-weight-api
- Nicolasvegam/garmin-connect-mcp: https://github.com/Nicolasvegam/garmin-connect-mcp
- Garmin Connect weight FIT gist: https://gist.github.com/janikvonrotz/c6faa987efef97535ed627130fdccaeb
- Open Wearables developer guide (official vs unofficial API): https://openwearables.io/blog/garmin-connect-api-developer-guide-activities-health-metrics
