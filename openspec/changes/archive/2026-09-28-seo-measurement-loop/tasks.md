# Tasks

## 1. Rolling observatory PR

- [x] 1.1 `scripts/geo/union-timeseries.mjs` and its tests (records keyed by
      `(date, source, provider)`, main wins, the branch adds only missing
      keys; malformed lines kept and reported; snapshots never overwritten).
- [x] 1.2 `seo-observatory.yml`: PAT required with a loud failure, checkout
      without persisted credentials, PAT only in the publish step; restore only
      while this repository's rolling PR is open (`scripts/geo/rolling-pr.mjs`,
      forks ignored); artifact of `reports/seo/` before the push;
      `--force-with-lease` pinned to the SHA read; on a refusal, plan again
      and rebuild on the current `main` (rolling weeks only while the PR is
      open, this run's records via `union-timeseries.mjs --since`), then
      retry once; one fixed branch and PR (updated when open).
- [x] 1.3 Union-merge the open weekly PRs (#1200, #1208, #1231, #1251, #1257)
      into `reports/seo/` and regenerate the dashboard.

## 2. IndexNow

- [x] 2.1 Key file at the landing root; `scripts/geo/indexnow.mjs` (key, diff,
      submit) with tests on an injected fetch.
- [x] 2.2 Deploy: verify the key file, diff the built sitemaps against the
      last submitted ones (cached; live as fallback, skip when neither is
      complete), submit after the smoke in a separate `indexnow` job, and
      save the baseline only on success and only after a real comparison;
      timeouts recomputed.

## 3. Analytics

- [x] 3.1 Landing `extension-install-clicked` with a slug-only payload, tested
      against the real landing markup.
- [x] 3.2 `reports/seo/umami-ai-referrers.md`: the saved Umami report for AI
      referrers (no new event).

## 4. AI visibility panel

- [x] 4.1 The audit's 10 panel prompts in EN and ES in `queries.json`, `lang`
      passed through the probe (`byLang` per entry). Brand prompts
      (`brand: true`) are kept out of every rate; the KPI uses the core rate
      over the 5 original `core: true` prompts.
- [x] 4.2 "Monthly AI visibility" and a dated "KPI denominators" note in the
      dashboard, with tests.

## 5. Spec

- [x] 5.1 MODIFY `analytics-port` "Landing tracks key funnel events".
