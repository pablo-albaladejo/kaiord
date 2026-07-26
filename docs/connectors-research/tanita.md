# Tanita / MyTANITA

Research for a **browser-extension connector**. Two systems exist under the "Tanita" name and they are **completely different backends** — do not conflate them:

| System                            | Host                                                       | Region | Auth                                                | API style                                | Official API?                       |
| --------------------------------- | ---------------------------------------------------------- | ------ | --------------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| **MyTANITA** (consumer app + web) | `mytanita.eu` (redirects `my.tanita.com` / `my.tanita.eu`) | Europe | Web: cookie `TANITASESS`; JSON API: JWT + `api-key` | Private JSON delta-sync API at `/de/api` | No (undocumented/private)           |
| **Health Planet**                 | `healthplanet.jp`                                          | Japan  | OAuth2 (`authorization_code` + refresh token)       | Documented XML/JSON REST                 | **Yes** (requires app registration) |

The AWS Lambda in this repo targets the **MyTANITA EU** private API. That is the primary target for the extension. Health Planet is covered at the end for reference only.

All live probes below were black-box, unauthenticated (only the public `api-key` header, no real credentials, no writes executed). Findings from the live API are marked **[live]**.

---

## UPDATE 2026-07-20 — no-password path via the web session (RECOMMENDED for an extension)

A live PoC (extension service worker + the user's `mytanita.eu` web session) resolved the
open question. **A browser-extension connector does NOT need the password** — reuse the web
session cookie and pull the site's own CSV export. This supersedes the "replicate the JSON API
login with stored creds" recommendation below (which still stands for the headless backend).

Probe findings (live, own account):

- The web session cookie **`TANITASESS`** (`HttpOnly`, `Max-Age=86400` / 24h) **travels from the
  extension service worker** with `credentials:"include"` and returns authenticated pages
  (`GET /en/user/trends` → 200 HTML). `SameSite` is a non-issue for an extension SW fetch.
- The cookie does **NOT** authenticate the JSON API: `GET /de/api/user-profiles` → `401
{"loggedin":false,"error":"Missing JWT"}`. Web app and JSON API are separate backends.
- The web frontend is **pure server-rendered** — it exposes **no** capturable JWT.

### The clean path: `GET /en/user/export-csv` (cookie-only)

```
GET https://mytanita.eu/en/user/export-csv
Cookie: TANITASESS=…            # no api-key, no JWT, no password
-> 200  Content-Type: application/csvm+json
        Content-Disposition: attachment; filename=YYYYMMDD_measurements.csv
```

Returns the **entire measurement history** as CSV (own account: 2264 rows since 2021), ISO dates,
clean floats, `-` for missing. **28 columns** — and it includes **segmental fields the JSON API
lacks**, so the CSV export is actually _richer_ than `/de/api/measurements`:

```
Date, "Weight (kg)", BMI, "Body Fat (%)", "Visc Fat", "Muscle Mass (kg)", "Muscle Quality",
"Bone Mass (kg)", "BMR (kcal)", "Metab Age", "Body Water (%)", "Physique Rating",
"Muscle mass - right arm/left arm/right leg/left leg/trunk",
"Muscle quality - right arm/left arm/right leg/left leg/trunk",
"Body fat (%) - right arm/left arm/right leg/left leg/trunk", "Heart rate"
```

Row example: `"2021-01-28 08:04:11",82.50,27.20,17.90,6.50,64.40,72.00,3.40,1970.00,28.00,55.00,5.00,-,…`

### Alternative: per-indicator Chart.js on `/en/user/trends`

`GET /en/user/trends?graph=<indicator>&time=last_6_months` embeds a **Chart.js** config; extract
`data.labels` (dates `DD/MM/YYYY`) paired by index with `datasets[0].data` (values). 12 indicators:
`weight, bmi, body_fat, body_water, bone_mass, bmr, heart_rate, metabolic_age, muscle_mass,
muscle_quality, physique_rating, visceral_fat`. Worse than the CSV (one fetch per indicator,
DD/MM dates, no segmentals) — use the CSV.

### Connector shape (no password)

1 fetch to `export-csv` (`credentials:"include"`) + CSV parse → maps directly onto Garmin's
body-composition upload (`POST /upload-service/upload` FIT `weight_scale`). Measurement pages:
`/en/user/measurements` (list) → `/en/user/measurements/{id}` (detail). **Read-only**; writing a
measurement still requires the JSON API (`POST /de/api/measurements`, JWT/password).

### Renewal (web path)

Only `TANITASESS` (24h) was observed — no persistent "remember" cookie in the tested session.
Renewal is autonomous **if** the cookie slides (re-issued per request; likely for a PHP session,
and the SW's own calls keep it fresh) **or** if logging in with "Remember my login" sets a
persistent cookie (to confirm). Otherwise ~daily web re-login (no password stored, but a manual
page visit).

---

## Repos & maintenance

### MyTANITA / mytanita.eu (EU private API)

- **`pablo-albaladejo/tanita-to-garmin-cdk`** (this repo) — the **only** known reverse-engineering of the mytanita.eu `/de/api` JSON API. GitHub code search for `mytanita.eu/de/api`, `mytanita Application-Authorization`, `mytanita login api-key` returns **no other repos**.
- **`s6652d10038/mytanitajgit`** — NOT relevant. It is a 5-page static HTML student site (`index.html`, `aboutaus.html`, `contactos.html`, `tanita.html`, `cliean.html`); nothing to do with the API.
- Net: **zero third-party prior art for the EU API.** You are on your own for mytanita.eu; this repo's `src/lambdas/ts/tanitaToJson/tanita.ts` is the reference implementation.

### Health Planet (JP, official OAuth2) — many repos, actively maintained

- **`koshilife/tanita-api-ruby-client`** (Ruby, 12★, updated 2025) — cleanest reference for the official API; implements OAuth2 with **refresh tokens**, read-only status endpoints.
- **`koshilife/omniauth-tanita`** (Ruby, 6★) — OmniAuth OAuth2 strategy.
- **`ansanloms/healthplanet-openapi`** (TypeScript, 2026) — an OpenAPI spec for Health Planet.
- **`YoshihideShirai/Hp2Fit`** (JS, 23★) — Health Planet → Google Fit / Fitbit.
- **`NegitoroWarship/healthplanet_garmin_sync`** (Python, 2026) — Health Planet → **Garmin Connect** (HP OAuth2 → FIT → Garmin upload). Directly analogous to this project, but JP side.
- Others: `teramonagi/healthplanet` (R), `muziyoshiz/embulk-input-healthplanet` (Ruby), `watahiki606/tanita` (TS innerscan scraper), `kefi550/go-healthplanet`, `starhoshi/SyncPlanet` (Swift→Apple Health), plus ~15 more. The HP ecosystem is large and healthy.

---

## Auth options (web cookie vs JWT vs stored creds) & renewal

### (a) Web app vs SPA/JSON API — two separate auth systems **[live]**

- **Web app = server-rendered, cookie session.** `GET https://mytanita.eu/` → `302` to `/en/user/login` and sets:
  `Set-Cookie: TANITASESS=...; Max-Age=86400; path=/; secure; HttpOnly` (server: nginx; PHP-style session name). The login page is a classic form (Username / Password / "Remember my login" checkbox) — a cookie session, 24 h lifetime, **`HttpOnly` (JS/extension cannot read it)**. This is _not_ a JWT SPA.
- **JSON API = JWT bearer.** The mobile app (`com.tanita.mytanita`) and the `/de/api` endpoints authenticate with a **JWT** carried in a **non-standard header** `Application-Authorization: Bearer <jwt>`, plus a hardcoded `api-key` header on every request, plus `Authorization: Basic Og==` (that is base64 of `":"` — an empty basic-auth placeholder, always sent verbatim).
- **CORS is wide open [live]** — every `/de/api` response returns:
  `access-control-allow-origin: *`, `access-control-allow-headers: *`, `access-control-allow-methods: POST, GET, OPTIONS, PUT, PATCH`, `access-control-allow-credentials: true`.

**Implication for the extension:** Do NOT try to ride the web cookie — `TANITASESS` is `HttpOnly` (unreadable from JS) and belongs to a different backend. Instead, **replicate the JSON API's JWT flow directly**: the extension can `POST /de/api/login` itself from any origin because CORS is `*`. The known `api-key` (`gsxmRFT8Mi0BpQqWkWruT9OwnjE0ZsN1b/Mryk9NOMc=`) is a static app key, not per-user. So the capturable/usable credential is the **JWT**, obtained by re-login, not the cookie.

### (b) JWT lifetime / refresh **[live + code]**

- **No refresh-token flow is known or in use.** The working Lambda (`tanita.ts`) performs a full email+password `POST /login` **on every run** and never caches or refreshes the JWT — strong evidence that re-login is the intended renewal path.
- A live `/refresh`, `/refresh-token`, `/token` endpoint could not be confirmed: the JWT middleware intercepts **all** unknown paths with `401 {"status":1,"loggedin":false,"error":"Missing JWT"}` before routing, so their existence is masked. Assume none.
- **Login response envelope [live]:** invalid credentials return `HTTP 200 {"status":"0","loggedin":false}` (note `status` is the string `"0"`, and there is **no** `jwt` field on failure). On success the body adds `jwt` (and `loggedin:true`); this is what the Lambda reads as `response.data.jwt`. JWT `exp` could not be decoded without a valid account.
- **Recommended renewal strategy for the extension:** store the user's **email + password** (or the last JWT), call `/login` to mint a JWT, and **re-login whenever a request returns `401 … "Missing JWT"` / invalid-JWT**. Treat the JWT as short-lived and disposable. This mirrors the Lambda and needs no refresh endpoint.

### (c) Reverse-eng repos for MyTANITA

- None besides this repo (see Repos section). The API is undocumented and unpublished.

### (d) Health Planet auth (reference)

- Official **OAuth2**: authorize `https://www.healthplanet.jp/oauth/auth` (`response_type=code`, `scope=innerscan,...`), token `https://www.healthplanet.jp/oauth/token` (`grant_type=authorization_code`). Token response includes `access_token`, **`refresh_token`**, and `expires_in` — so it _does_ have refreshable long-lived sessions, unlike the EU API. Requires registering a client app (`client_id`/`client_secret`) with Tanita JP. See Health Planet section.

---

## Endpoint catalog (mytanita.eu `/de/api`)

Base URL: `https://mytanita.eu/de/api` (the `/de/` locale segment is interchangeable — any locale works; the api-key is global).

**Sync model [live]:** every collection returns a **delta-sync envelope**: `{"status":0,"timestamp":<unixNow>,"created":[…],"updated":[…],"deleted":[…]}`. Reads are driven by a unix `timestamp` param meaning "changes since T" (measurements also accept `timestamp_up_to` for an upper bound). This created/updated/deleted shape is a **bidirectional sync protocol** — the client is expected to _push_ its local `created`/`updated`/`deleted` and _pull_ the server's. That, plus `PUT/PATCH/POST` in the CORS allow-methods, is the basis for the write capability below.

**Auth tiers [live]:** three endpoints work with only the `api-key` (no JWT): `login`, `indicators`, `countries`. Everything else is gated by the JWT middleware.

| Method             | Path                                                                                                              | Auth         | R/W                  | Params / body                                                                                                                  | Returns / notes                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST               | `/login`                                                                                                          | api-key only | write→token          | JSON `{email, password, type:"regular_user"}`                                                                                  | `{status:"0"/1, loggedin, jwt}`. **[live confirmed]** No body → `400 {"error":"post data missing"}`.                                                                                                                                                                                                                                            |
| GET                | `/indicators`                                                                                                     | api-key only | read                 | `?timestamp=0` (required; missing → `400 "no 'timestamp' sent"`)                                                               | **Full field catalog**, 37 indicators (see below). **[live confirmed]** Public.                                                                                                                                                                                                                                                                 |
| GET                | `/countries`                                                                                                      | api-key only | read                 | `?timestamp=0`                                                                                                                 | Country list `{countryCode, name, …}` in the sync envelope. **[live confirmed]** Public.                                                                                                                                                                                                                                                        |
| GET                | `/user-profiles`                                                                                                  | JWT          | read                 | `?timestamp=0`                                                                                                                 | `created[]` of profiles, each `{id, userProfileId, …}`. `id` is the key used to filter measurements. **[live: JWT-gated confirmed]**                                                                                                                                                                                                            |
| GET                | `/measurements`                                                                                                   | JWT          | read                 | `?timestamp=<from>&timestamp_up_to=<to>`                                                                                       | `created[]` of measurements; each `{datetime:<unixSec>, userProfileId, measurementEntries:[{indicatorAbbrv, value}, …]}`. **[live: JWT-gated confirmed]**                                                                                                                                                                                       |
| POST / PUT / PATCH | `/measurements`                                                                                                   | JWT          | **write (inferred)** | Inferred body: `{created:[{datetime, userProfileId, measurementEntries:[{indicatorAbbrv, value}]}], updated:[…], deleted:[…]}` | **Write path is architecturally present** (JWT-gate confirmed live; `POST/PUT/PATCH` in CORS allow-methods; symmetric sync envelope; the mobile app pushes scale readings here). **Not executed** (no test account) — treat the exact body as unverified but high-confidence. This is how a **manual / synthetic measurement** would be posted. |
| —                  | `/goals`, `/devices`, `/reference-values`, `/user-profile`, `/measurement-entries`, `/notifications`, `/settings` | JWT          | ?                    | —                                                                                                                              | **Unverified.** The JWT gate masks all unknown paths behind identical `401 "Missing JWT"`, so existence cannot be confirmed from outside. `goals` is plausible because 15 indicators are flagged `targetable` (see below). Do not assume these exist without a live JWT to test.                                                                |

### Required headers (from working Lambda)

```
api-key: gsxmRFT8Mi0BpQqWkWruT9OwnjE0ZsN1b/Mryk9NOMc=   (static app key, all requests)
Application-Authorization: Bearer <jwt>                   (authenticated calls; NON-standard header)
Authorization: Basic Og==                                (literal; base64 of ":")
Content-Type: application/json
```

### Measurement field catalog — `/indicators` (37 indicators) **[live]**

Each indicator: `{id, name, abbrv, minValue, maxValue, stepValue, selectedValue, valueType, decimalPlaces, targetable}`. `value` in `measurementEntries` is a string keyed by `abbrv` (=`indicatorAbbrv`).

| id        | abbrv                                              | name                                           | unit (valueType) | targetable |
| --------- | -------------------------------------------------- | ---------------------------------------------- | ---------------- | ---------- |
| 1         | `weight`                                           | Weight                                         | kg               | yes        |
| 2         | `bmi`                                              | BMI                                            | bmi              | no         |
| 3         | `body_fat`                                         | Body Fat %                                     | percentage       | yes        |
| 4         | `body_water`                                       | Body Water %                                   | percentage       | yes        |
| 5         | `muscle_mass`                                      | Muscle Mass                                    | kg               | yes        |
| 6         | `metabolic_age`                                    | Metabolic Age                                  | age              | yes        |
| 7         | `visceral_fat`                                     | Visceral Fat                                   | level            | yes        |
| 8         | `bone_mass`                                        | Bone Mass                                      | kg               | yes        |
| 9         | `muscle_quality`                                   | Muscle Quality                                 | mq               | yes        |
| 10        | `bmr`                                              | BMR                                            | kcal             | no         |
| 11        | `steps_walking`                                    | Steps Walking                                  | —                | yes        |
| 12        | `steps_running`                                    | Steps Running                                  | —                | yes        |
| 13        | `calories_burned`                                  | Calories Burned                                | —                | yes        |
| 14        | `time`                                             | Time                                           | min              | yes        |
| 15        | `fat_mass`                                         | Fat Mass                                       | kg               | yes        |
| 16        | `ffm`                                              | Fat Free Mass                                  | kg               | yes        |
| 17        | `sarcophenic`                                      | Sarcophenic                                    | percentage       | —          |
| 18        | `muscle_mass_score`                                | Muscle Mass score                              | score            | —          |
| 19        | `body_fat_score`                                   | Body Fat Score                                 | score            | yes        |
| 20        | `body_water_mass`                                  | Body Water Mass                                | kg               | —          |
| 21        | `body_fat_mass`                                    | Body Fat Mass                                  | kg               | —          |
| 22–27, 30 | `impedance_1` … `impedance_1000`, `impedance_6_25` | Impedance @ 1/5/50/250/500/1000 kHz + 6.25 kHz | ohm              | —          |
| 28        | `phase`                                            | Phase                                          | rad              | —          |
| 29        | `protein`                                          | Protein                                        | kg               | —          |
| 31        | `physique_rating`                                  | Physique Rating                                | —                | —          |
| 32/33     | `ecw` / `ecw_mass`                                 | Extra-cellular water / mass                    | —                | —          |
| 34/35     | `icw_mass` / `icw`                                 | Intra-cellular water mass / water              | —                | —          |
| 36        | `heart_rate`                                       | Heart rate                                     | bpm              | no         |
| 37        | `muscle_mass_j`                                    | Muscle mass judgement                          | —                | no         |

The **15 `targetable` indicators** (`weight, body_fat, body_water, muscle_mass, metabolic_age, visceral_fat, bone_mass, muscle_quality, steps_walking, steps_running, calories_burned, time, fat_mass, ffm, body_fat_score`) are the ones the app lets you set goals for — implying a goals write surface.

**Fields the current Lambda maps** (subset): `weight, bmi, body_fat, visceral_fat, muscle_mass, muscle_quality, bone_mass, bmr, metabolic_age, body_water, physique_rating` (segmental muscle/fat + heart_rate are stubbed as `undefined`). **Available but unmapped:** `fat_mass, ffm, body_fat_mass, body_water_mass, protein, phase, sarcophenic, muscle_mass_score, body_fat_score, heart_rate, steps_walking/running, calories_burned, time`, the 7 `impedance_*`, and `ecw/ecw_mass/icw/icw_mass`. (Note: the Lambda references segmental fields like `muscle_mass_right_arm`, `body_fat_trunk` — those abbrvs are **not** in the EU `/indicators` catalog, so segmental data is likely absent from this API tier / device-dependent.)

---

## Health Planet (official, for reference)

Japanese cloud (`healthplanet.jp`). Official, documented, OAuth2 — but **requires client-app registration** and is a **different account/dataset** from the EU MyTANITA account, so it is off-table for an EU-account extension unless the user specifically has a Health Planet account.

- **Docs:** https://www.healthplanet.jp/apis/api.html
- **OAuth2:** authorize `GET/POST https://www.healthplanet.jp/oauth/auth` (`client_id`, `redirect_uri`, `scope`, `response_type=code`); token `POST https://www.healthplanet.jp/oauth/token` (`grant_type=authorization_code`, `client_id`, `client_secret`, `redirect_uri`, `code`). Response = `access_token` + **`refresh_token`** + `expires_in`. Refreshable, unlike the EU API.
- **Scopes:** `innerscan` (body composition), `sphygmomanometer` (blood pressure), `pedometer` (steps), `smug` (urine sugar; discontinued 2020).
- **Data endpoints (READ-ONLY):**
  - `GET/POST /status/innerscan.{xml|json}` — body composition
  - `GET/POST /status/sphygmomanometer.{xml|json}` — blood pressure
  - `GET/POST /status/pedometer.{xml|json}` — steps
  - Params: `access_token`, `date`, `from`, `to`, `tag`.
- **Tag codes:** `6021`=weight(kg), `6022`=body fat %, `6023–6029`=muscle mass / bone mass / visceral fat / BMR / metabolic age / body water / physique rating; BP `622E`=systolic, `622F`=diastolic, `6230`=pulse; pedometer `6331`=steps.
- **No write API** — measurement upload is not supported; read-only, rate-limited to ~60 req/hour.
- **Best library reference:** `koshilife/tanita-api-ruby-client`. **Garmin-sync analogue:** `NegitoroWarship/healthplanet_garmin_sync`.

---

## Sources

- This repo: `src/lambdas/ts/tanitaToJson/tanita.ts` (working MyTANITA EU implementation)
- Live black-box probes of `https://mytanita.eu/` and `https://mytanita.eu/de/api/*` (redirect/cookie headers, CORS preflight, `/login`, `/indicators`, `/countries`, JWT-gate behavior) — July 2026
- MyTANITA app: https://play.google.com/store/apps/details?id=com.tanita.mytanita · https://apps.apple.com/gb/app/my-tanita-healthcare-app/id1139808391
- Web app hosting vendor (UHP Software): http://tanitaservices-production.uhp-software.com/en/login · https://my.tanita.com/login/
- GitHub searches: `mytanita`, `tanita api`, `mytanita.eu`, `healthplanet` (repo + code search)
- `s6652d10038/mytanitajgit` (confirmed unrelated static site)
- Health Planet official API: https://www.healthplanet.jp/apis/api.html
- `koshilife/tanita-api-ruby-client`, `koshilife/omniauth-tanita`, `ansanloms/healthplanet-openapi`, `YoshihideShirai/Hp2Fit`, `NegitoroWarship/healthplanet_garmin_sync`
