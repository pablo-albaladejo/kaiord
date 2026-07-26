# Train2Go

**Train2Go / T2GO** (`app.train2go.com`, marketing site `train2go.com`) is a niche Spanish
endurance-coaching SaaS. It is the leading training-management platform among Spanish-speaking
endurance coaches (self-reported 12,000+ users across Spain and Latin America), founded by athlete
**Antón Ruanova** and coach **David Iglesias** — who started managing athletes in Excel and built a
purpose-made tool. It offers coach-branded (white-label) Android/iOS apps, multisport plan building
(micro/macro cycles), and a Strava integration for pulling athletes' completed activities.

Confirmed stack (from the kaiord `train2go-bridge`): **Laravel + Livewire**, internal JSON/HTML API
under `/api/v2/*`. Forms are AJAX "remote" forms (`class="remote"`, Rails/Laravel-UJS style with
`data-remote` / `data-method`). Auth is cookie-based (see below). There is **no public/developer
API** — the `/api/v2/*` surface is the app's own internal first-party API, undocumented externally.

## Repos & maintenance (likely none)

Prior art integrating this Train2Go is effectively **non-existent** on GitHub and the web. Exhaustive
`gh search repos` / `gh search code` and web searches found:

- **No third-party integrations, SDKs, wrappers, or tools** for `app.train2go.com` anywhere public.
- The only substantive integration code is the user's **own** repo `pablo-albaladejo/kaiord`
  (`packages/train2go-bridge/`) — the MV3 Chrome-extension bridge this research supports. It is the
  single source of confirmed endpoint knowledge.
- `janschwarz/train2go` and `endencia/train2go` are unrelated namesakes (empty/blank repos, not the
  Spanish platform).
- Web/domain-list hits (`train2go.net/.es/.biz/.org`, expired-domain dumps, DGA/wordlist datasets,
  a `RandomWebsite` domain array) are noise — not integrations.
- `ValereTamwo/Domains_Attribution_TaskGen` contains an auto-generated **UI-task dataset** for
  `app.train2go.com` (Spanish "explore training options" browsing intents) — synthetic agent tasks,
  not an integration, but it independently confirms the domain is a public fitness/wellness site.
- `juditgonzalezprol/IMPACTHON_WEB` merely lists "David Iglesias, company: Train2Go" on a team page
  — corroborates the founder, no code.

**Conclusion: no external ecosystem. Kaiord's bridge is, as far as public evidence shows, the only
programmatic Train2Go integration in existence.** No maintenance/community signal to track.

## Session persistence & renewal (remember_web)

**Two independent cookies, two independent lifetimes** — this is standard Laravel auth:

1. **`train2go_session`** — the Laravel _session_ cookie. Observed `SameSite=Lax`, `Max-Age=7200`
   (2h). This is the short-lived session; it authenticates requests only while the server-side
   session record is alive.
2. **`remember_web_<hash>`** — Laravel's _"remember me" (recaller)_ cookie. Long-lived. This is what
   silently keeps the login alive after the 2h session lapses.

**How the silent re-auth works (`Illuminate\Auth\SessionGuard`):**

- On each request, `SessionGuard::user()` first tries the session (the user id stashed under a
  session key). If the 2h session has expired/rotated and the session no longer identifies a user,
  the guard falls back to the **recaller**: it reads the `remember_web_*` cookie via
  `recaller()` / `userFromRecaller()`.
- The recaller cookie is **encrypted + signed**; decrypted, its plaintext is three pipe-separated
  fields: **`{user_id}|{remember_token}|{password_hash}`**.
- The guard looks up the user by `id`, then calls `retrieveByToken()` which compares the cookie's
  `remember_token` against the `users.remember_token` column, and validates the password-hash
  segment. On match, it **re-logs the user in and starts a fresh session** (regenerates the 2h
  session) — completely transparently, no credentials, no redirect to login.
- Net effect: as long as the `remember_web_*` cookie is valid and the DB `remember_token` hasn't
  been rotated (rotation happens on explicit logout or password change), the user is _effectively
  permanently authenticated_; the 2h session simply gets minted fresh on demand. **This is exactly
  why the extension's captured session stays alive far beyond 2h.**

**Default remember-cookie lifetime — confirmed:** Laravel's `SessionGuard` default
`$rememberDuration` is **`2628000` minutes ≈ 5 years** (returned by `getRememberDuration()`;
overridable per-guard via a `remember` config value, or via `Auth::viaRemember`/`$guard->setRememberDuration()`).
So absent custom config, the `remember_web_*` cookie persists ~5 years. (The DB `remember_token` is
the real gate; the cookie is refreshed/kept in step with it.)

**Cookie name detail:** the `<hash>` suffix is `sha1('web')` for the default `web` guard, i.e.
`remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d`. One `remember_web_*` cookie exists per guard
that used "remember me".

**Practical implication for the bridge:** to survive the 2h `train2go_session` expiry you must let
the browser present the `remember_web_*` cookie so Laravel re-mints the session. Since the bridge
fetches with `credentials: "include"` from a service worker on `app.train2go.com`, the browser
attaches _both_ cookies automatically — the recaller handles renewal server-side with zero extra
work. There is no token-refresh endpoint to call; renewal is implicit in any authenticated request
once the session lapses. (Caveat: if Train2Go enables Laravel's `AuthenticateSession` middleware,
remember-based re-auth can be tied to the session's password-hash and invalidated on password
change across devices — a known Laravel nuance, but it does not shorten the normal idle-renewal
behavior.)

## Endpoint catalog (confirmed vs inferred)

**Confirmed** = observed in live-captured Train2Go responses / the app's own emitted markup (kaiord
`packages/train2go-bridge/test/fixtures/*`, sanitized: IDs & CSRF replaced with placeholders, but
structure/attributes intact) or in the bridge's runtime code. **Inferred** = not directly observed;
extrapolated from REST/resource-routing symmetry.

Base URL for all: `https://app.train2go.com`. All require the auth cookies above. `user` param is the
athlete id (a.k.a. `pupil_id`); `role: 2` in ping = athlete/pupil.

| #   | Method       | Path                                                                                                | Payload / params                                                                              | R/W       | Status                                | Notes                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GET          | `/api/v2/profile/ping`                                                                              | —                                                                                             | Read      | **Confirmed**                         | JSON. Returns `data.user{ id, role, name, surname, status, bpm_max, bpm_rest, weight, height, gender, trainer_id, trainer{id,name,surname} }`, plus `success/errors/message/redirect`. Cheap auth/liveness probe + basic profile.                                                                                                                                            |
| 2   | GET          | `/api/v2/workplan/weekly/{date}?user={id}[&source={w}]`                                             | date path, `user`                                                                             | Read      | **Confirmed**                         | HTML: 3-week grid, all activity metadata. Dates carried in CSS class `workplan-table-date-YYYY-MM-DD`. No activity _descriptions_.                                                                                                                                                                                                                                           |
| 3   | GET          | `/api/v2/workplan/daily/{date}?user={id}&source=sidebar`                                            | date path, `user`, `source`                                                                   | Read      | **Confirmed**                         | HTML fragment: full activity **description**, coach **links** (`<a href>`), and the per-day **comment thread**. No date anchor in markup (bridge backfills from param). Richest read endpoint.                                                                                                                                                                               |
| 4   | GET          | `/api/v2/workplan/tooltip/activity/{id}`                                                            | activity id                                                                                   | Read      | **Confirmed**                         | HTML tooltip for one activity (hover detail). In bridge allowlist.                                                                                                                                                                                                                                                                                                           |
| 5   | GET          | `/user/details` (page)                                                                              | —                                                                                             | Read      | **Confirmed**                         | Full HTML user-details page. Source of zones-sync: FTP, LTHR/sport, threshold pace, CSS, full Z0–Z5 HR/power/pace band tables, `bpm_max`, `bpm_rest`, weight, height (also embeds gender/birthday/fat/imc/smoker/notes). Also **hosts the write forms** in rows 8–12.                                                                                                        |
| 6   | POST         | `/api/v2/comments?user={id}&source=sidebar-dailyplan&navigate=default`                              | `_token` (CSRF), `date` (hidden, required), `content` (textarea)                              | **Write** | **Confirmed**                         | Explicit `method="POST"`, `class="remote"`. Creates a day-scoped comment. This is how athlete↔coach threads (and de-facto "I did it, here's my Garmin link") are posted.                                                                                                                                                                                                     |
| 7   | DELETE       | `/api/v2/comments/{commentId}?source=sidebar-dailyplan`                                             | —                                                                                             | **Write** | **Confirmed**                         | Delete button `data-method="delete"` + `data-remote=...` (UJS). Deletes a comment.                                                                                                                                                                                                                                                                                           |
| 8   | PUT/PATCH*   | `/api/v2/details/physio/{userId}`                                                                   | `_token`, `gender, birthday, height, weight, bpm_rest, bpm_max, fat, imc, smoker, user_notes` | **Write** | **Confirmed endpoint; verb inferred** | `class="remote"` form on `/user/details`, no explicit `method`/`_method` in markup (JS-driven). Saves the athlete's physiological profile / thresholds.                                                                                                                                                                                                                      |
| 9   | PUT/PATCH*   | `/api/v2/hrzones/{zoneId}`                                                                          | `_token`, `user_id`, `z0_lower…z4_upper` (5 bands)                                            | **Write** | **Confirmed endpoint; verb inferred** | One form per sport (fixtures show ids 8044/8045/8046). Saves HR zone bands. `class="remote hrzone-form"`.                                                                                                                                                                                                                                                                    |
| 10  | PUT/PATCH*   | `/api/v2/paces/{id}`                                                                                | `_token`, `sport_id`, `pupil_id`, `measurement[zX_lower/upper][0..1]` (min:sec pairs)         | **Write** | **Confirmed endpoint; verb inferred** | Pace-zone bands per sport (ids 8984/11241/10418). `class="remote"`.                                                                                                                                                                                                                                                                                                          |
| 11  | PUT/PATCH*   | `/api/v2/records/{id}`                                                                              | `_token`, record fields                                                                       | **Write** | **Confirmed endpoint; verb inferred** | `class="remote"` form (`/records/14327`). Saves athlete records/PBs. Field set not fully captured.                                                                                                                                                                                                                                                                           |
| 12  | PUT/PATCH*   | `/api/v2/tests/{id}`                                                                                | `_token`, test fields                                                                         | **Write** | **Confirmed endpoint; verb inferred** | `class="remote"` form (`/tests/16133`). Saves fitness-test results. Field set not fully captured.                                                                                                                                                                                                                                                                            |
| 13  | POST         | `/api/v2/hrzones`, `/api/v2/paces`, `/api/v2/records`, `/api/v2/tests`, `/api/v2/comments` (create) | resource fields + `_token`                                                                    | **Write** | **Inferred**                          | Standard Laravel resource `store` counterparts to the `update`s in 8–12 (create-new). Not observed.                                                                                                                                                                                                                                                                          |
| 14  | GET          | `/api/v2/comments/...` or `/api/v2/details/...` (standalone reads)                                  | —                                                                                             | Read      | **Inferred**                          | Comments/zones arrive embedded in HTML (rows 3 & 5); no standalone JSON GET was observed but resource `show`/`index` routes likely exist by symmetry.                                                                                                                                                                                                                        |
| —   | (none found) | "mark workout done" / "upload completed activity"                                                   | —                                                                                             | Write     | **Not found**                         | No dedicated workout-completion or activity-upload endpoint observed. Completion enters Train2Go via the **Strava webhook integration** (athlete's Strava activity → Train2Go), and athletes/coaches cross-reference by pasting **Garmin Connect links into day comments** (row 6). So "mark done" is effectively the comment endpoint + Strava sync, not a native API verb. |

\* Verb note for rows 8–12: these target an **existing resource id** and save data, so they are
unambiguously **writes**. The exact HTTP verb (PUT vs PATCH vs POST) is **not visible** in the
markup — the forms carry no `method`/`_method` attribute and are submitted by the "remote" JS layer,
which infers the verb. REST/resource convention makes PUT or PATCH most likely. Treat verb as
inferred, endpoint + write-semantics as confirmed.

**Read reach beyond current bridge:** Yes — the bridge today reads only rows 1–4 (GET allowlist).
Rows 5 (zones/thresholds via `/user/details`) is already read by the newer zones-sync feature.
Activity _descriptions_, coach _links_, and full _comment threads_ are all already in the row-3
payload (read-available now, some just under-parsed historically). So more **read** is readily
available with no new network surface.

**Write reach:** Real write endpoints demonstrably exist (rows 6–12): posting/deleting **day
comments** (6, 7) is the cleanest, fully-confirmed write (explicit POST/`data-method=delete`, simple
`content`+`date` payload, CSRF via `_token`). Saving **zones/thresholds/records/tests** (8–12) is
confirmed as writable but needs the AJAX verb pinned down (and the CSRF `_token` scraped from the
`/user/details` page) before use. **The bridge is read-only today by deliberate allowlist design**
(`content.js` blocks everything except the four GET patterns), not because writes are impossible.

## Sources

- Kaiord bridge (only real integration; endpoint truth): `pablo-albaladejo/kaiord` —
  `packages/train2go-bridge/` (`background.js`, `content.js`, `test/content.test.js`,
  `test/fixtures/{ping-active.json,details-active.html,daily-with-comments.html,weekly.html,daily.html}`,
  `store-listing.md`) and `openspec/{specs,changes}/**/train2go-*`.
- Train2Go marketing/company: <https://train2go.com/>, <https://train2go.com/plataforma/>,
  <https://triatlonchannel.com/2020/02/03/version-2-0-de-la-plataforma-de-entrenamientos-train2go/>,
  <https://www.comparasoftware.co/train2go>
- Strava integration (explains no native upload/complete endpoint): <https://developers.strava.com/docs/>
- Laravel remember-me / recaller mechanics & 5-year default:
  <https://github.com/laravel/framework/blob/8.x/src/Illuminate/Auth/SessionGuard.php>,
  <https://github.com/laravel/ideas/issues/2395>,
  <https://github.com/laravel/framework/issues/23814>,
  <https://cookiedatabase.org/cookie/laravel-php-framework/remember_web_/>,
  <https://kfirba.me/blog/the-undocumented-authenticatesession-middleware-decoded>,
  <https://laracasts.com/discuss/channels/laravel/how-does-laravel-remember-me-works>
- Namesake/noise repos (ruled out): `janschwarz/train2go`, `endencia/train2go`;
  domain-context corroboration: `ValereTamwo/Domains_Attribution_TaskGen` (task JSON for
  `app.train2go.com`), `juditgonzalezprol/IMPACTHON_WEB` (founder mention).
