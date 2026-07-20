# TrainingPeaks

Deep research on the TrainingPeaks integration ecosystem for the **cookie / web-session** approach against the internal API `tpapi.trainingpeaks.com`. The official OAuth2 Partner API is dev-gated and off the table, but is documented at the end for reference.

**Headline finding (corrects the working assumption):** the captured Bearer is _not_ useless — it is simply **short-lived and must be minted fresh from the cookie**. Three independent implementations (JamsusMaximus MCP, nagelflorian MCP, rubengarciam CLI) all do the identical two-step:

1. Send the cookie **and only the cookie** (no `Authorization`) to `GET https://tpapi.trainingpeaks.com/users/v3/token`.
2. That returns a **~1-hour Bearer access token**. Use `Authorization: Bearer <token>` for **all** data endpoints (the cookie is _not_ sent to data endpoints).

This reconciles "tpapi 401s if Authorization present, 200 with cookie-only": that behavior is specific to the **`/users/v3/token`** endpoint. Data endpoints are the opposite — they require the Bearer, not the cookie.

---

## Repos & maintenance

| Repo                                                                                                        | Lang / kind                       | Stars   | Auth approach                                              | Notes                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------- | ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **JamsusMaximus/trainingpeaks-mcp**                                                                         | Python MCP                        | ~113    | Cookie → `/users/v3/token` → Bearer                        | **Most complete** internal-API map: workouts CRUD, fitness, metrics, events, peaks, library, strength, analysis, equipment, zones, coach/groups. Actively maintained, well-tested. Browser cookie auto-extract via `browser_cookie3`. |
| **freekode/tp2intervals**                                                                                   | Kotlin/Spring                     | ~91     | `Production_tpAuth` cookie                                 | TP ↔ Intervals.icu ↔ TrainerRoad sync. Cookie pasted into config; calls `tpapi.trainingpeaks.com`. "Educational purposes."                                                                                                            |
| **nagelflorian/trainingpeaks-mcp-server**                                                                   | TypeScript MCP                    | (small) | Cookie (`TP_AUTH_COOKIE` env) → `/users/v3/token` → Bearer | Clean reference impl of the token exchange (`src/auth.ts`). Same endpoint set as JamsusMaximus incl. strength on `api.peakswaresb.com`.                                                                                               |
| **rubengarciam/trainingpeaks** (also in `openclaw/skills`)                                                  | Python CLI/skill, **stdlib only** | ~2      | Cookie → `/users/v3/token` → Bearer                        | Zero-dependency `tp.py`. Persists cookie + cached token + athlete_id under `~/.config/trainingpeaks/`. Good, readable canonical implementation.                                                                                       |
| **cpfair/tapiriik** (`services/TrainingPeaks`)                                                              | Python                            | (large) | **Official OAuth2 Partner API**                            | _Not_ cookie-based — the reference for the official API: `/v1/athlete/profile`, `/v2/workouts/{start}/{end}`, `/v3/file` upload (base64 gzip PWX, 202 + Location poll). Useful for the official-endpoints section.                    |
| **pablo-albaladejo/trainingpeaks-sdk**                                                                      | TypeScript SDK                    | ~2      | (this repo's own SDK)                                      | Clean-architecture TS SDK; `src/adapters/constants/api-endpoints.ts` + `auth.ts`.                                                                                                                                                     |
| **lsantome/Trainingpeaks-MCP**, **tildecomunicacion/trainingpeaks_mcp**, **ju-jr/trainingpeaks-mcp-render** | MCP variants/forks                | 0       | Cookie                                                     | Smaller/derivative; same cookie approach.                                                                                                                                                                                             |
| **Lucs1590/strava-to-trainingpeaks**                                                                        | Python                            | ~12     | "Assisted" (browser) upload                                | Downloads Strava, uploads to TP in assisted mode (no headless API write).                                                                                                                                                             |
| **TrainingPeaks/tp-public-api-auth**                                                                        | Python (official)                 | ~7      | Official OAuth2 example                                    | Official sample; local `/callback`, `/get-token`, `/refresh-token` demo only.                                                                                                                                                         |
| **TrainingPeaks/PartnersAPI** (wiki)                                                                        | Docs (official)                   | —       | Official                                                   | Authoritative source for official OAuth URLs + endpoints (see reference section).                                                                                                                                                     |

---

## Session persistence & renewal

### The credential chain

- **Durable credential = the cookie `Production_tpAuth`** (domain `.trainingpeaks.com`, `SameSite=None`). Set by the ASP.NET forms login on `home.trainingpeaks.com/login`. This is what lasts.
- **Ephemeral credential = the Bearer access token**, minted on demand from the cookie.

### Token exchange (verbatim behavior across 3 impls)

```
GET https://tpapi.trainingpeaks.com/users/v3/token
Headers: Cookie: Production_tpAuth=<value>        # NO Authorization header
->
200 { "success": true,
      "token": { "access_token": "...", "expires_in": 3600 },
      "athleteId": <n>, "userId": <n>, "username": "<email>" }
401  -> cookie expired/invalid
```

- **Access token lifetime ≈ 3600 s (1 hour)** in the internal flow (`expires_in`). Implementations cache it in memory and refresh with a **60 s buffer** (`Date.now() > expiresAt - 60s`).
- **On any `401` from a data endpoint**: clear the cached token, re-exchange the cookie once, retry the request. (Standard in all three.)
- **Rate limiting**: clients self-throttle to **~150 ms minimum between requests** (`MIN_REQUEST_INTERVAL = 0.15`); the API returns **429** when exceeded.

### Is the cookie server-refreshed / sliding? Lifetime?

- **Lifetime: "several weeks."** JamsusMaximus README: _"If your session cookie expires (typically after several weeks), use `tp_refresh_auth` … or run `tp-mcp auth` again."_ tp2intervals: cookie _"will expire when you log out or after an extended period of inactivity."_
- **Sliding vs absolute: not conclusively documented.** It is a classic ASP.NET **forms-auth cookie**, which by default uses **sliding expiration** (each authenticated hit extends it), but note: the token-exchange calls hit `tpapi`, not the forms-auth cookie issuer, and **none of the OSS clients capture/persist an updated `Set-Cookie`** — so in practice they treat the cookie as a fixed multi-week credential and re-paste when it dies. No documented "remember me" / explicitly long-lived variant beyond this default lifetime.
- One secondary source claimed a "9-minute in-memory refresh"; the authoritative code does **not** do this — it refreshes the _Bearer_ per `expires_in` (~1 h), not the cookie.

### How the cookie is obtained / "re-login"

- **Manual**: DevTools → Application → Cookies → `app.trainingpeaks.com` (or `tpapi.trainingpeaks.com`) → copy `Production_tpAuth`.
- **Automated (local only)**: JamsusMaximus uses **`browser_cookie3`** to read the cookie straight from the local Chrome/Firefox/Safari/Edge/Brave/Opera cookie store (`domain_name=".trainingpeaks.com"`, `name=="Production_tpAuth"`).
- **Headless / CI**: all three support a `TP_AUTH_COOKIE` env var as a first-class auth source.

### Programmatic re-login against the .NET forms login — the gap

- **No open-source repo automates username/password login.** There is no code anywhere that POSTs credentials to `https://home.trainingpeaks.com/login` to obtain a fresh `Production_tpAuth`. Every tool depends on a cookie already minted by a real browser session.
- To do it yourself you would need to drive the **ASP.NET forms login**: GET the login page, extract the anti-forgery/`__RequestVerificationToken` (and any `ReturnUrl`), POST `Username`/`Password` + token, and harvest the `Set-Cookie: Production_tpAuth=…` from the response — or, more robustly, drive it with a headless browser (Playwright/Selenium) and export the cookie. This is the only missing piece for full unattended operation; expect it to be the fragile part (CSRF token, possible bot/JS challenges on the login page).

---

## Endpoint catalog

**Internal host:** `https://tpapi.trainingpeaks.com` — Bearer auth (from cookie exchange), except the token endpoint (cookie-only).
**Peaksware hosts (reuse the same Bearer):** strength + analysis on `https://api.peakswaresb.com`.
Placeholders: `{aid}` = athleteId (from `user.personId`), `{uid}` = userId.

### Auth & profile

| Method | Path              | Data / notes                                                                                                                         | R/W             |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| GET    | `/users/v3/token` | **Cookie-only** (`Cookie: Production_tpAuth=…`, no Authorization) → `{token:{access_token,expires_in}, athleteId, userId, username}` | R (mint Bearer) |
| GET    | `/users/v3/user`  | Full profile: `userId`, `personId`, `email`, `athletes[]` (athleteId, FTPs, weight, coachedBy), `settings.account.isPremium`         | R               |

### Workouts (fitness API)

| Method          | Path                                                                     | Data / notes                                                                                                                                                                                                                                                                                                                                | R/W   |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| GET             | `/fitness/v6/workouttypes`                                               | Sport-type catalogue (typeValueId → name)                                                                                                                                                                                                                                                                                                   | R     |
| GET             | `/fitness/v6/athletes/{aid}/workouts/{start}/{end}`                      | Workouts by date range (planned **and** completed; dates `YYYY-MM-DD`; clients cap range at **90 days**)                                                                                                                                                                                                                                    | R     |
| GET             | `/fitness/v6/athletes/{aid}/workouts/{workoutId}`                        | Single workout (planned + actual metrics)                                                                                                                                                                                                                                                                                                   | R     |
| GET             | `/fitness/v6/athletes/{aid}/workouts/{workoutId}/details`                | Extended detail                                                                                                                                                                                                                                                                                                                             | R     |
| **POST**        | `/fitness/v6/athletes/{aid}/workouts`                                    | **Create planned/structured workout.** Body: `athleteId, workoutDay, workoutTypeFamilyId, workoutTypeValueId, title, isHidden`, optional `totalTimePlanned` (**hours** = minutes/60), `distancePlanned` (**meters**), `tssPlanned`, `ifPlanned`, `description`, `structure` (JSON string), `startTimePlanned`, `userTags`, `feeling`, `rpe` | **W** |
| **PUT**         | `/fitness/v6/athletes/{aid}/workouts/{workoutId}`                        | Update (GET → mutate → PUT the full object)                                                                                                                                                                                                                                                                                                 | **W** |
| **DELETE**      | `/fitness/v6/athletes/{aid}/workouts/{workoutId}`                        | Delete workout                                                                                                                                                                                                                                                                                                                              | **W** |
| **POST**        | `/fitness/v6/athletes/{aid}/workouts/{workoutId}/filedata`               | **Upload completed activity file** to an existing workout. Body: `{workoutDay, data: base64(gzip(FIT/TCX/GPX/PWX)), fileName, uploadClient:"TP Web App"}`                                                                                                                                                                                   | **W** |
| GET             | `/fitness/v6/athletes/{aid}/workouts/{workoutId}/rawfiledata/{fileId}`   | Download raw device/attachment file (binary)                                                                                                                                                                                                                                                                                                | R     |
| **DELETE**      | `/fitness/v6/athletes/{aid}/workouts/{workoutId}/filedata/{fileId}`      | Delete an attached file                                                                                                                                                                                                                                                                                                                     | **W** |
| GET/POST/DELETE | `/fitness/v2/athletes/{aid}/workouts/{workoutId}/comments[/{commentId}]` | Workout comments                                                                                                                                                                                                                                                                                                                            | R/W   |
| GET/PUT         | `/fitness/v6/workouts/{workoutId}/privateWorkoutNote`                    | Private note                                                                                                                                                                                                                                                                                                                                | R/W   |

### Library

| Method   | Path                                                            | Data / notes                                                           | R/W   |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | ----- |
| **POST** | `/fitness/v6/athletes/{aid}/commands/addworkoutfromlibraryitem` | Schedule a library workout onto the calendar                           | **W** |
| **POST** | `/fitness/v6/athletes/{aid}/workouts`                           | Library-driven create also routes through the workouts create endpoint | **W** |

### Fitness / performance / plan

| Method   | Path                                                                 | Data / notes                                                                                                                                | R/W |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| **POST** | `/fitness/v1/athletes/{aid}/reporting/performancedata/{start}/{end}` | **CTL/ATL/TSB** time series. Body: `{atlConstant:7, atlStart:0, ctlConstant:42, ctlStart:0, workoutTypes:[]}` (POST, but read-only compute) | R   |
| GET      | `/fitness/v1/athletes/{aid}/atp/{start}/{end}`                       | Annual Training Plan                                                                                                                        | R   |

### Personal records / peaks

| Method | Path                                                     | Data / notes                                                                        | R/W |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | --- |
| GET    | `/personalrecord/v2/athletes/{aid}/{Sport}`              | `?prType=&startDate=&endDate=` (Sport = `Bike`/`Run`; e.g. `power20min`, `speed5K`) | R   |
| GET    | `/personalrecord/v2/athletes/{aid}/workouts/{workoutId}` | Per-workout peaks (`?displayPeaksForBasic=true`)                                    | R   |

### Metrics / health / nutrition

| Method   | Path                                                                | Data / notes                                                                                                                                                                                                              | R/W   |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| GET      | `/metrics/v3/athletes/{aid}/consolidatedtimedmetrics/{start}/{end}` | weight, pulse, HRV, sleep, spo2, steps, rmr, injury                                                                                                                                                                       | R     |
| **POST** | `/metrics/v3/athletes/{aid}/consolidatedtimedmetric`                | **Log a metric.** Body: `{athleteId, timeStamp, id:null, details:[{type,label,value,time,units,formatedUnits,min,max,temporaryId}]}` (type ids: weight=9, pulse=5, HRV=60, sleep=6, spo2=53, steps=58, rmr=15, injury=23) | **W** |
| GET      | `/fitness/v1/athletes/{aid}/nutrition/{start}/{end}`                | Nutrition data                                                                                                                                                                                                            | R     |

### Events / calendar

| Method     | Path                                                    | Data / notes            | R/W   |
| ---------- | ------------------------------------------------------- | ----------------------- | ----- |
| GET        | `/fitness/v6/athletes/{aid}/events/focusevent`          | Primary goal race       | R     |
| GET        | `/fitness/v6/athletes/{aid}/events/nextplannedevent`    | Next event              | R     |
| GET        | `/fitness/v6/athletes/{aid}/events/{start}/{end}`       | Events in range         | R     |
| **POST**   | `/fitness/v6/athletes/{aid}/event`                      | Create event            | **W** |
| **PUT**    | `/fitness/v6/athletes/{aid}/event`                      | Update event            | **W** |
| **DELETE** | `/fitness/v6/athletes/{aid}/event/{id}`                 | Delete event            | **W** |
| GET        | `/fitness/v2/athletes/{aid}/calendarNote/{start}/{end}` | Calendar notes in range | R     |
| GET/DELETE | `/fitness/v1/athletes/{aid}/calendarNote/{id}`          | Read / delete note      | R/W   |
| **POST**   | `/fitness/v1/athletes/{aid}/calendarNote`               | Create note             | **W** |
| GET        | `/fitness/v1/athletes/{aid}/availability`               | Athlete availability    | R     |

### Settings / zones / equipment

| Method   | Path                                                                          | Data / notes                                 | R/W         |
| -------- | ----------------------------------------------------------------------------- | -------------------------------------------- | ----------- |
| GET      | `/fitness/v1/athletes/{aid}/settings`                                         | Zones, thresholds, account settings          | R           |
| GET      | `/fitness/v2/athletes/{aid}/powerzones` \| `/heartratezones` \| `/speedzones` | Zone definitions                             | R           |
| **PUT**  | `/fitness/v2/athletes/{aid}/{threshold-path}`                                 | Update FTP/threshold                         | **W**       |
| **POST** | `/trainingzones/v1/users/{uid}/{metric}/calculate/{method}`                   | Compute zones (`{...body, zoneType:method}`) | R (compute) |
| GET      | `/fitness/v1/athletes/{aid}/poollengthsettings`                               | Pool settings                                | R           |
| **POST** | `/fitness/v1/athletes/{aid}/nutritionsettings`                                | Update nutrition settings                    | **W**       |
| GET/PUT  | `/fitness/v1/athletes/{aid}/equipment`                                        | Bikes/shoes (GET → mutate → PUT)             | R/W         |

### Coach / groups

| Method          | Path                                                              | Data / notes                                     | R/W   |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------ | ----- |
| GET             | `/coaches/v1/coaches/{coachId}/tags`                              | Coach tag/group list                             | R     |
| POST/PUT        | `/coaches/v1/coaches/{coachId}/tags[...]`                         | Create/update tags                               | W     |
| **POST/DELETE** | `/coaches/v1/coaches/{coachId}/tags/{tagId}/athletes/{athleteId}` | Add/remove athlete to tag (one athlete per call) | **W** |

### Strength & analysis — host `https://api.peakswaresb.com` (same Bearer)

| Method     | Path                                    | Data / notes                                                                                                       | R/W   |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| **POST**   | `/rx/activity/v1/workouts/save`         | Create structured strength workout (`workoutType:"StructuredStrength"`, blocks/exercises/sets); returns numeric id | **W** |
| GET        | `/rx/activity/v1/workouts/{id}/summary` | Strength compliance summary                                                                                        | R     |
| **DELETE** | `/rx/activity/v1/workouts/{id}`         | Delete strength workout                                                                                            | **W** |
| **POST**   | `/workout-analysis/v2/analyze/summary`  | Whole-workout totals (TSS/IF/NP/EF…). Body `{workoutId}`                                                           | R     |
| **POST**   | `/workout-analysis/v2/analyze/charts`   | Per-second time series + per-channel min/max/avg/zones. Body `{workoutId}`                                         | R     |
| **POST**   | `/workout-analysis/v2/analyze/laps`     | Device laps. Body `{workoutId}`                                                                                    | R     |
| ~~POST~~   | ~~`/workout-analysis/v1/analyze`~~      | **RETIRED — 404 since ~2026-07.** Use the three v2 calls above.                                                    | —     |

---

## Official Partner API (reference only — dev-gated, OFF the table)

- **Access:** approved commercial partners only. Request at `https://api.trainingpeaks.com/request-access`. Personal use not granted. Most partner scopes are limited to profile + metrics upload; workout upload is via `v3/file`.
- **OAuth (production):** Authorize `https://oauth.trainingpeaks.com/OAuth/Authorize` · Token `https://oauth.trainingpeaks.com/oauth/token`
- **OAuth (sandbox):** Authorize `https://oauth.sandbox.trainingpeaks.com/OAuth/Authorize` · Token `https://oauth.sandbox.trainingpeaks.com/oauth/token`
- **Grants:** `authorization_code`, `refresh_token`. **Access token `expires_in` = 600 s (10 min)** in the docs (tapiriik caches ~30 min). Refresh-token lifetime unpublished.
- **Scopes (non-inclusive):** `athlete:profile`, `workouts:read`, `workouts:details` (e.g. `workouts:details` does _not_ imply `workouts:read`). Metrics upload is a separate grant.
- **API host:** `https://api.trainingpeaks.com` (sandbox `https://api.sandbox.trainingpeaks.com`). Auth: `Authorization: Bearer <token>`.

| Method   | Path                                                                             | Notes                                                                                                                                                                                                      | R/W   |
| -------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| GET      | `v1/athlete/profile`                                                             | Basic profile + zones                                                                                                                                                                                      | R     |
| GET      | `v2/workouts/{start}/{end}`                                                      | Own workouts by date range                                                                                                                                                                                 | R     |
| GET      | `v2/workouts/{athleteId}/{start}/{end}`                                          | Coach: an athlete's workouts                                                                                                                                                                               | R     |
| **POST** | `v3/file`                                                                        | **Upload activity file.** Body `{UploadClient, Filename, SetWorkoutPublic, Data: base64(gzip(PWX))}`. Async: `202` + `Location` header → poll until `{Completed:true, WorkoutIds:[…]}`. `422` = duplicate. | **W** |
| **POST** | `v2/metrics`                                                                     | Upload metrics (weight, HRV, steps, sleep, stress)                                                                                                                                                         | **W** |
| GET      | `v1/coach/athletes`, `v1/coach/profile`, `v1/coach/assistants[/{id}[/athletes]]` | Coach roster                                                                                                                                                                                               | R     |

---

## Gotchas

- **Cookie-only vs Bearer split is the whole trick.** `GET /users/v3/token` must be **cookie-only** (adding `Authorization` 401s it). Every _other_ `tpapi` endpoint needs the **Bearer** minted from it (the cookie alone won't authorize data calls). This is the resolution of the "Bearer is a red herring" observation — the Bearer just has to be a _fresh, self-minted_ one, not the one from a stale trace.
- **Bearer ≈ 1 h.** Cache in memory, refresh with a 60 s buffer; on a data-endpoint `401`, clear + re-exchange the cookie once, then retry.
- **Cookie ≈ several weeks, then dies hard.** No OSS tool refreshes it programmatically. Renewal today = re-copy from a browser (`browser_cookie3` automates the _read_, not a _login_). True unattended renewal requires driving the `home.trainingpeaks.com/login` ASP.NET forms flow (anti-forgery token) or a headless browser — nobody has published this.
- **Treat the cookie like a password** — it grants full account access. Inject via secret manager / `TP_AUTH_COOKIE`; never commit it. (JamsusMaximus goes out of its way to keep the cookie out of logs/`__repr__`.)
- **Rate limit:** ~150 ms between requests; handle `429`.
- **Coach accounts:** resolve athlete id from `user.personId`, **not** `athletes[0]` (that list is the coached roster). Read/write endpoints take an explicit `{aid}`.
- **Units:** durations are **hours** (float; `totalTimePlanned = minutes/60`), distances are **meters**. Dates `YYYY-MM-DD`; workout list range capped at 90 days client-side.
- **Two write paths for activities:** create a _planned_ workout (`POST …/workouts` with structure/metrics) vs attach a _completed_ file (`POST …/workouts/{id}/filedata` with base64-gzipped FIT/TCX/GPX/PWX). They are distinct — to push a completed activity you typically create or locate the workout, then upload `filedata`.
- **Strength + analysis are a different host** (`api.peakswaresb.com`) but reuse the same Bearer.
- **`workout-analysis/v1` is dead** (404 since ~2026-07); use the three `v2` sub-endpoints.
- The **official** partner API is realistically limited to profile read + metrics/file upload for most partners, and is gated behind approval — which is exactly why the cookie approach exists.

---

## Sources

- JamsusMaximus/trainingpeaks-mcp — https://github.com/JamsusMaximus/trainingpeaks-mcp (source read: `client/http.py`, `auth/browser.py`, `auth/validator.py`, `auth/storage.py`, `tools/*.py`, README)
- nagelflorian/trainingpeaks-mcp-server — https://github.com/nagelflorian/trainingpeaks-mcp-server (source read: `src/auth.ts`, `src/api.ts`, `src/api/*.ts`)
- rubengarciam/trainingpeaks — https://github.com/rubengarciam/trainingpeaks (`scripts/tp.py`, `SKILL.md`); mirror: https://github.com/openclaw/skills/blob/main/skills/rubengarciam/trainingpeaks/SKILL.md
- freekode/tp2intervals — https://github.com/freekode/tp2intervals
- cpfair/tapiriik — https://github.com/cpfair/tapiriik/blob/master/tapiriik/services/TrainingPeaks/trainingpeaks.py (official OAuth Partner API reference)
- pablo-albaladejo/trainingpeaks-sdk — https://github.com/pablo-albaladejo/trainingpeaks-sdk
- TrainingPeaks/tp-public-api-auth — https://github.com/TrainingPeaks/tp-public-api-auth
- TrainingPeaks/PartnersAPI wiki — https://github.com/TrainingPeaks/PartnersAPI/wiki (OAuth + endpoint pages)
- TrainingPeaks API help — https://help.trainingpeaks.com/hc/en-us/articles/234441128-TrainingPeaks-API
- An Update on TrainingPeaks Partner API — https://www.trainingpeaks.com/blog/an-update-on-trainingpeaks-partner-api/
- django-allauth TrainingPeaks provider — https://docs.allauth.org/en/dev/socialaccount/providers/trainingpeaks.html
- Login page — https://home.trainingpeaks.com/login
- nagelflorian MCP listing (lobehub) — https://lobehub.com/mcp/nagelflorian-trainingpeaks-mcp-server
