# WHOOP

Deep research on the WHOOP integration ecosystem, focused on (1) keeping a captured
Cognito Bearer session alive without a browser tab, and (2) the internal + official
api.prod.whoop.com endpoint catalog (read AND write).

**Bottom line up front:**

- WHOOP's identity is **AWS Cognito in region `us-west-2`** (confirmed: the apps
  ultimately hit `cognito-idp.us-west-2.amazonaws.com`).
- Two auth surfaces exist. The **mobile apps** (iOS/Android) route Cognito through a
  WHOOP-owned proxy `POST https://api.prod.whoop.com/auth-service/v3/whoop/` that injects
  a **confidential** `ClientId` + `SECRET_HASH` server-side (so the mobile app client has a
  secret and cannot be called directly). The **web app** (app.whoop.com) uses
  `amazon-cognito-identity-js`, which by design uses a **public** app client (no secret) —
  meaning the web refresh token _can_ be redeemed directly against
  `cognito-idp.us-west-2.amazonaws.com` with no browser tab. This is the promising path.
- Refresh token is **NOT rotated** on `REFRESH_TOKEN_AUTH` (reuse the same one); it is
  long-lived (~30 days on mobile; Cognito default). Access tokens are short (web ≈ 1h,
  matching what the extension sees; iOS = 24h / `ExpiresIn: 86400`).
- The **official** developer API (`/developer/v2`) is effectively **read-only** (only
  write is `DELETE /developer/v2/user/access` to revoke). All _write_ capability
  (log workout, journal, edit sleep, alarms, profile) lives only in the **internal**
  `api.prod.whoop.com/<service>/...` API.

---

## Repos & maintenance

### Reverse-engineered / internal API (the relevant ones for renewal + writes)

| Repo                                                              | Stars | Lang                      | Updated             | What it gives us                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | ----: | ------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **thebriangao/totem** (search also lists it as `briangaoo/totem`) |   ~98 | TypeScript                | 2026-07-19 (active) | **The goldmine.** MCP server, full read+write to the private iOS API, "47 microservices / 311 operations". Documents the Cognito proxy refresh flow (`src/whoop/cognito.ts`, `WHOOP.md`, `TOOLS.md`). Auto-refresh Cognito, single-flight refresh gate.                                                |
| **chukfinley/whoopsi**                                            | small | Dart/Flutter + Python CLI | active              | Android app impersonation (`v5.430.0`, `com.whoop.android`). Uses the same `/auth-service/v3/whoop/` Cognito proxy; CLI README documents grabbing the `RefreshToken` from the Cognito `InitiateAuth` response via mitmproxy, then `whoop login --refresh-token`. Refresh tokens "long-lived (months)". |
| **r3cursive/rp-whoop**                                            | small | TypeScript                | active              | Has its own `src/whoop/cognito.ts` (same proxy pattern).                                                                                                                                                                                                                                               |
| **Asherlc/dofek** (`packages/whoop-whoop`)                        | small | TypeScript                | active              | `cognito.ts` + strength-training exploration scripts against the internal API.                                                                                                                                                                                                                         |
| **Stanford-Health/wearipedia**                                    | large | Python                    | active              | `devices/whoop/whoop_user.py` uses internal `/activities-service/v1/cycles/aggregate/range/{user_id}?apiVersion=7` and `api-7.whoop.com` HR endpoint. Older but documented.                                                                                                                            |
| **jjur/whoop-sleep-HR-data-api** (`whoop-data`, PyPI)             |    ~4 | Python                    | 2025-12             | Web-app internal API: `auth-service/v2/whoop/sign-in`, `sleep-service`, `vow-service`, `metrics-service`, `core-details-bff`, `activities-service`. Good older map of internal endpoints.                                                                                                              |
| **jacc/whoop-re**                                                 |    ~4 | md                        | 2026-03             | Notes: prod `api.prod.whoop.com`, dev `api.dev.whoop.com`, auth `api-7.whoop.com`. States internal bearer "expires after 24 hours" and is found via SSL sniffing.                                                                                                                                      |
| **patrickloeber/whoop-analyzer**                                  |     — | Python                    | —                   | Legacy password auth against `api-7.whoop.com`, requests to `/developer`.                                                                                                                                                                                                                              |
| **pelo-tech/whoop-api-spec**                                      |   ~23 | OpenAPI                   | 2025-06             | Unofficial OpenAPI spec on SwaggerHub (`DovOps/whoop-unofficial-api`).                                                                                                                                                                                                                                 |

### Official developer API (OAuth2, read-only) — for reference

| Repo                                                                                                                                                                                                                                                                  | Stars | Lang                                                                                          | Notes                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **shashankswe2020-ux/whoop-mcp**                                                                                                                                                                                                                                      |  ~132 | TypeScript                                                                                    | Most-starred; official OAuth MCP, 18+ endpoints, `/developer` base.      |
| **hedgertronic/whoop**                                                                                                                                                                                                                                                |  ~100 | Python                                                                                        | Clean official v2 client (`oauth/oauth2/auth`+`/token`, `developer/v2`). |
| **koala73/whoopskill**                                                                                                                                                                                                                                                |   ~46 | TypeScript                                                                                    | Official `/developer/v2` CLI-as-skill.                                   |
| **ianm199/unofficialWhoopAPI**                                                                                                                                                                                                                                        |   ~43 | Python                                                                                        | Wrapper (name says unofficial but tracks the public API).                |
| Others: felixnext/whoopy, ferueda/go-whoop, tryAGI/Whoop (C#), zmanian/whoop-api (Rust), metriport/metriport, RedPlanetHQ/core, raycast/extensions (`whoop`), nissand/whoop-mcp-server-claude, RomanEvstigneev/whoop-mcp-server, muinmomin/whoop-cli, car1os/whoopper |     — | All consume the **official** OAuth API. Useful as endpoint/field references, not for renewal. |

---

## Session persistence & renewal (Cognito refresh)

### The core facts (confirmed from totem `WHOOP.md` + `src/whoop/cognito.ts`)

- **Region:** `us-west-2`. Underlying IdP host: `cognito-idp.us-west-2.amazonaws.com`.
- **Access token:** Cognito JWT (~1100 chars). iOS TTL = **24h** (`ExpiresIn: 86400`).
  The **web** app's Bearer is ~**1h** — consistent with a separate web app-client whose
  token validity is set to 1h. Claim `custom:user_id` (matches what the extension captures).
- **Refresh token:** JWE blob (~2000 chars), **~30-day** TTL (mobile). On
  `REFRESH_TOKEN_AUTH`, AWS returns a **new `AccessToken` + `IdToken` but does NOT rotate
  the `RefreshToken`** — you keep reusing the same refresh token until it expires/revokes.
  (totem's `refreshCognitoSession` explicitly falls back to the existing refresh token.)

### Two ways to redeem a refresh token WITHOUT a browser tab

**Path A — direct to Cognito (best fit for the web/extension case).**
The web app uses `amazon-cognito-identity-js`, which stores tokens in `localStorage` under:

```
CognitoIdentityServiceProvider.<clientId>.LastAuthUser              -> the <user> sub
CognitoIdentityServiceProvider.<clientId>.<user>.accessToken
CognitoIdentityServiceProvider.<clientId>.<user>.idToken
CognitoIdentityServiceProvider.<clientId>.<user>.refreshToken       <-- what we need
CognitoIdentityServiceProvider.<clientId>.<user>.clockDrift
```

So the extension can read **both the app `clientId` (it's literally in the key name) and
the refresh token** straight out of `localStorage` — no need to hardcode/discover the
client id. Because a browser JS client is **public (no client secret)**, you can call
Cognito directly:

```
POST https://cognito-idp.us-west-2.amazonaws.com/
Content-Type: application/x-amz-json-1.1
X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
{
  "AuthFlow": "REFRESH_TOKEN_AUTH",
  "AuthParameters": { "REFRESH_TOKEN": "<refreshToken from localStorage>" },
  "ClientId": "<clientId from the localStorage key>"
}
```

Response `AuthenticationResult.AccessToken` is the fresh ~1h Bearer to send to
`api.prod.whoop.com`. This is exactly `CognitoUser.refreshSession()` under the hood and
needs no browser tab. **Caveat:** only works if the web app client is a public client
(true for `amazon-cognito-identity-js`) and if the pool/client doesn't require a
`SECRET_HASH`. Verify at runtime by reading the actual localStorage keys — I could NOT
find WHOOP's web `clientId`/`userPoolId` published anywhere, so extract them live rather
than expecting a documented constant.

**Path B — via WHOOP's proxy (the mobile pattern; fallback).**

```
POST https://api.prod.whoop.com/auth-service/v3/whoop/
Content-Type: application/x-amz-json-1.1
X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
User-Agent: aws-sdk-swift/1.5.86 ua/2.1 api/cognito_identity_provider#1.5.86 os/ios#26.3.1 ...
{
  "AuthFlow": "REFRESH_TOKEN_AUTH",
  "AuthParameters": { "REFRESH_TOKEN": "<refreshToken>" },
  "ClientId": ""
}
```

The proxy fills in the real (confidential) `ClientId` + `SECRET_HASH` and forwards to
`cognito-idp.us-west-2.amazonaws.com`. `ClientId` is sent **empty**. This is what the
mobile clients use; it 403s a non-iOS `User-Agent`, so you must impersonate the AWS Swift
SDK UA. Use this only if the web token turns out to belong to the confidential client.

### Practical renewal loop

1. On capture, also scrape `CognitoIdentityServiceProvider.*.refreshToken` (+ derive
   `clientId` from the key) from app.whoop.com localStorage.
2. When the Bearer nears expiry (or on a 401 `WhoopAuthExpiredError`), call Path A.
3. Store the new AccessToken; keep the same refresh token (not rotated).
4. Re-seed the refresh token roughly every ~30 days (or whenever a call returns
   `NotAuthorizedException`), by opening the app once. Add a single-flight guard so
   concurrent syncs don't stampede the refresh (totem does exactly this).

---

## Endpoint catalog

### A) OFFICIAL developer API (OAuth2, read-only) — base `https://api.prod.whoop.com/developer`

OAuth: `GET /oauth/oauth2/auth`, `POST /oauth/oauth2/token`. Scope `offline` required for a
refresh token; `expires_in` = **3600s**; refresh tokens **rotate** (must save the newest).
Rate limit: **100 req/min and 10,000 req/day** per client; `429` on breach;
`X-RateLimit-Limit: 100, 100;window=60, 10000;window=86400`.

| Method | Path                                         | R/W | Data                             |
| ------ | -------------------------------------------- | --- | -------------------------------- |
| GET    | `/developer/v2/user/profile/basic`           | R   | name, email, user id             |
| GET    | `/developer/v2/user/measurement/body`        | R   | height, weight, max HR           |
| GET    | `/developer/v2/cycle`                        | R   | physiological cycles (paged)     |
| GET    | `/developer/v2/cycle/{cycleId}`              | R   | one cycle                        |
| GET    | `/developer/v2/cycle/{cycleId}/recovery`     | R   | recovery for cycle               |
| GET    | `/developer/v2/cycle/{cycleId}/sleep`        | R   | sleep for cycle                  |
| GET    | `/developer/v2/recovery`                     | R   | all recoveries (paged)           |
| GET    | `/developer/v2/activity/sleep`               | R   | all sleeps (paged)               |
| GET    | `/developer/v2/activity/sleep/{sleepId}`     | R   | one sleep                        |
| GET    | `/developer/v2/activity/workout`             | R   | all workouts (paged)             |
| GET    | `/developer/v2/activity/workout/{workoutId}` | R   | one workout                      |
| DELETE | `/developer/v2/user/access`                  | W*  | revoke OAuth access (only write) |

Pagination: `limit` (max 25, default 10) + `nextToken`. (`/developer/v1/...` is the older
version, same shapes; v1 used e.g. `/developer/v1/user/profile/basic`.)

### B) INTERNAL app API (Cognito Bearer) — base `https://api.prod.whoop.com`, all calls append `?apiVersion=7`

Headers used by the app: `Authorization: Bearer <cognito access token>`,
`x-whoop-device-platform: iOS`, `x-whoop-ios-version`, `x-whoop-bundle-name: com.whoop.iphone`,
`x-whoop-installation-identifier: <uuid>`, `x-whoop-time-zone`, `locale`, `accept: */*`.
(Sources: totem `TOOLS.md`/`WHOOP.md`, wearipedia, jjur/whoop-data.)

**Bootstrap / account / profile**

| Method      | Path                                                                         | R/W | Data                      |
| ----------- | ---------------------------------------------------------------------------- | --- | ------------------------- |
| GET         | `/users-service/v2/bootstrap`                                                | R   | user identity / bootstrap |
| GET         | `/auth-service/v2/user`                                                      | R   | account details (legacy)  |
| GET         | `/profile-service/v1/profile`                                                | R   | profile                   |
| PUT         | `/profile-service/v1/profile`                                                | W   | update profile            |
| GET         | `/users-service/v1/stealth-mode`                                             | R   | privacy setting           |
| GET         | `/users-service/v1/hidden-metrics/{metric}` (e.g. `BODY_COMP`, `HEALTHSPAN`) | R   | hidden metrics            |
| POST/DELETE | `/users-service/v1/hidden-metrics/{metric}`                                  | W   | hide / show metric        |
| GET         | `/activities-service/v1/user-state`                                          | R   | current activity state    |

**Cycles / recovery / sleep / strain (snapshots + deep dives)**

| Method | Path                                                                             | R/W | Data                                     |
| ------ | -------------------------------------------------------------------------------- | --- | ---------------------------------------- |
| GET    | `/activities-service/v1/cycles/aggregate/range/{userId}` (`startTime`,`endTime`) | R   | cycle aggregates over range (wearipedia) |
| GET    | `/core-details-bff/v0/cycles/details`                                            | R   | cycle details (jjur)                     |
| GET    | `/home-service/v1/home?date={date}`                                              | R   | recovery+sleep+strain snapshot           |
| GET    | `/home-service/v1/calendar/overview?date=`                                       | R   | monthly calendar                         |
| GET    | `/home-service/v1/calendar/recovery?date=`                                       | R   | recovery scores                          |
| GET    | `/home-service/v1/deep-dive/recovery?date=`                                      | R   | HRV, RHR, resp rate, SpO2                |
| GET    | `/home-service/v1/deep-dive/sleep/last-night?date=`                              | R   | sleep stages, hypnogram, disturbances    |
| GET    | `/home-service/v1/deep-dive/strain?date=`                                        | R   | strain, HR zones, steps                  |
| GET    | `/sleep-service/v1/sleep-events`                                                 | R   | sleep events (jjur)                      |
| GET    | `/vow-service/v1/vows/sleep/1d/cycle`                                            | R   | sleep metric by cycle (jjur)             |
| GET    | `/vow-service/v1/vows/recovery/1d/cycle`                                         | R   | recovery metric by cycle (jjur)          |
| PUT    | `/core-details-bff/v2/sleep-details/{activityId}`                                | W   | adjust sleep time                        |
| GET    | `/coaching-service/v2/sleepneed`                                                 | R   | sleep-need recommendation                |

**Workouts / activities**

| Method | Path                                              | R/W | Data                           |
| ------ | ------------------------------------------------- | --- | ------------------------------ |
| GET    | `/activities-service/v1/sports/history`           | R   | sports/activity history (jjur) |
| GET    | `/core-details-bff/v1/cardio-details?activityId=` | R   | detailed workout metrics       |
| POST   | `/core-details-bff/v0/create-activity`            | W   | **manual activity entry**      |
| DELETE | `/core-details-bff/v1/cardio-details?activityId=` | W   | delete activity                |

**Heart rate / metrics / live**

| Method       | Path                                                               | R/W | Data                        |
| ------------ | ------------------------------------------------------------------ | --- | --------------------------- |
| GET          | `/metrics-service/v1/metrics` / `/metrics-service/v1/metrics/user` | R   | HR + metrics (whoopsi/jjur) |
| GET          | `/metrics-service/v1/consumerstats/mobile/highwatermark/min`       | R   | sync high-watermark         |
| GET          | `/health-tab-bff/v1/health-tab`                                    | R   | current heart rate (live)   |
| GET          | `/health-service/v2/stress-bff/{date}`                             | R   | stress timeline             |
| GET          | `/hr-zones-service/v1/bff/zones` / `/settings`                     | R   | HR zones / settings         |
| POST         | `/hr-zones-service/v1/maxhr`                                       | W   | set max HR                  |
| POST         | `/hr-zones-service/v1/bff/custom`                                  | W   | custom HR zones             |
| (legacy) GET | `https://api-7.whoop.com/users/{userId}/metrics/heart_rate`        | R   | raw HR series (wearipedia)  |

**Strength trainer**

| Method | Path                                                       | R/W | Data                     |
| ------ | ---------------------------------------------------------- | --- | ------------------------ |
| GET    | `/weightlifting-service/v3/prs`                            | R   | personal records         |
| GET    | `/weightlifting-service/v1/exercise/{id}`                  | R   | exercise metadata        |
| GET    | `/weightlifting-service/v3/exercise/{id}/exercise_history` | R   | sessions                 |
| GET    | `/weightlifting-service/v3/workout-library`                | R   | saved templates          |
| POST   | `/weightlifting-service/v2/weightlifting-workout/activity` | W   | **log strength workout** |
| POST   | `/weightlifting-service/v3/workout-template`               | W   | create template          |
| POST   | `/weightlifting-service/v2/custom-exercise`                | W   | custom exercise          |

**Journal / behaviors / women's health / alarms / coach / social**

| Method | Path                                                                       | R/W | Data                    |
| ------ | -------------------------------------------------------------------------- | --- | ----------------------- |
| GET    | `/journal-service/v3/journals/drafts/mobile/{date}`                        | R   | daily behaviors         |
| PUT    | `/journal-service/v2/journals/entries/user/date/{date}`                    | W   | journal entry           |
| PUT    | `/autopop-service/v1/autopop/JOURNAL/{cycleId}`                            | W   | auto-populate behaviors |
| GET    | `/behavior-impact-service/v1/impact`                                       | R   | behavior impact list    |
| GET    | `/womens-health-service/v1/menstrual-cycle-insights?date=`                 | R   | cycle phase/predictions |
| PUT    | `/womens-health-service/v1/menstrual-cycle-insights/log`                   | W   | log period/ovulation    |
| POST   | `/womens-health-service/v1/symptom-insights/log/symptoms?requestDate=`     | W   | log symptoms            |
| GET    | `/smart-alarm-bff/v1/schedule/all`                                         | R   | alarm schedules         |
| PUT    | `/smart-alarm-service/v1/smartalarm/preferences`                           | W   | alarm prefs             |
| POST   | `/ai-conversation-bff/v1/conversation` (+ `/turn`)                         | W   | WHOOP Coach             |
| GET    | `/community-service/v1/communities/memberships`                            | R   | communities             |
| GET    | `/coaching-service/v1/performance-assessment/{period}/data/{isoTimestamp}` | R   | assessment metrics      |

**Auth (internal)**

| Method | Path                             | R/W | Data                                                                |
| ------ | -------------------------------- | --- | ------------------------------------------------------------------- |
| POST   | `/auth-service/v3/whoop/`        | W   | Cognito proxy (InitiateAuth / REFRESH_TOKEN_AUTH), `x-amz-json-1.1` |
| POST   | `/auth-service/v2/whoop/sign-in` | W   | legacy password sign-in -> access+refresh token + user id (jjur)    |

> For a Tanita-style **write** integration (push body composition / weight), the internal
> API has no clean "body measurement write" endpoint exposed in these repos; the closest
> writable surfaces are `create-activity`, weightlifting workout logging, journal, and
> profile update. Body weight in WHOOP is a profile/measurement concept that the _official_
> API only exposes read-only (`/developer/v2/user/measurement/body`). Writing weight back
> to WHOOP is not a documented capability in any repo found.

---

## Gotchas

- **Region is us-west-2**, not eu-*. Refresh must target `cognito-idp.us-west-2.amazonaws.com`.
- **Web vs mobile app client differ.** Mobile = confidential client (has secret) → must use
  the `/auth-service/v3/whoop/` proxy with `ClientId:""`. Web = public client
  (`amazon-cognito-identity-js`, no secret) → can hit Cognito directly. Confirm which one
  your captured Bearer belongs to by decoding its `client_id`/`aud`-style claim and by
  reading the localStorage `clientId`.
- **`ClientId` for the mobile proxy is empty on the wire** — WHOOP fills it server-side. You
  cannot replay the mobile flow against raw Cognito without WHOOP's secret.
- **Proxy is UA-gated:** `/auth-service/v3/whoop/` 403s a Node/browser User-Agent; it wants
  the `aws-sdk-swift/...` UA. Direct Cognito (Path A) has no such gate.
- **Refresh token not rotated** on `REFRESH_TOKEN_AUTH` (reuse it). But the **official**
  OAuth `/oauth/oauth2/token` refresh **does** rotate — don't conflate the two flows.
- **`?apiVersion=7`** is required on internal calls and bumps ~every 6 months with app
  releases; a stale value can break requests.
- **Internal API is undocumented and unstable** — paths move across `-bff`/service versions
  (v0/v1/v2/v3 coexist). Pin to what you observe in the live app.
- **Official API is read-only** for data (only write = revoke access). Any write
  (log workout, edit sleep, journal, alarms) requires the internal Cognito-authed API.
- **ToS:** internal API use is unofficial and against WHOOP's terms; the refresh token is a
  secret — store it like a credential (the CLIs chmod 600 it).
- Couldn't find WHOOP's **web** `userPoolId` / `clientId` published anywhere — extract at
  runtime from localStorage rather than hardcoding.

---

## Sources

- thebriangao/totem — https://github.com/thebriangao/totem ( `README.md`, `WHOOP.md`, `TOOLS.md`, `src/whoop/cognito.ts`, `src/whoop/constants.ts` )
- chukfinley/whoopsi — https://github.com/chukfinley/whoopsi ( `app/lib/core/constants.dart`, `cli/README.md`, `cli/whoop_cli/auth.py` )
- r3cursive/rp-whoop — https://github.com/r3cursive/rp-whoop ( `src/whoop/cognito.ts` )
- Asherlc/dofek — https://github.com/Asherlc/dofek ( `packages/whoop-whoop`, `docs/whoop.md` )
- Stanford-Health/wearipedia — https://github.com/Stanford-Health/wearipedia ( `wearipedia/devices/whoop/whoop_user.py` )
- jjur/whoop-sleep-HR-data-api (whoop-data) — https://github.com/jjur/whoop-sleep-HR-data-api ( `whoop_data/endpoints.py` ); PyPI https://pypi.org/project/whoop-data/
- jacc/whoop-re — https://github.com/jacc/whoop-re
- pelo-tech/whoop-api-spec — https://github.com/pelo-tech/whoop-api-spec ; SwaggerHub https://app.swaggerhub.com/apis/DovOps/whoop-unofficial-api/
- patrickloeber/whoop-analyzer — https://github.com/patrickloeber/whoop-analyzer
- Official clients: hedgertronic/whoop — https://github.com/hedgertronic/whoop ; shashankswe2020-ux/whoop-mcp — https://github.com/shashankswe2020-ux/whoop-mcp ; koala73/whoopskill — https://github.com/koala73/whoopskill ; ianm199/unofficialWhoopAPI — https://github.com/IanMcLaughlin19/unofficialWhoopAPI
- WHOOP for Developers — OAuth: https://developer.whoop.com/docs/developing/oauth/ ; Refresh: https://developer.whoop.com/docs/tutorials/refresh-token-javascript/ ; Rate limiting: https://developer.whoop.com/docs/developing/rate-limiting/ ; API ref: https://developer.whoop.com/api/
- AWS Cognito token endpoint / JWT docs — https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html ; amazon-cognito-identity-js localStorage key format (StackOverflow / GitHub issue #87)
