> Completed: 2026-09-28

# Proposal: Close the SEO/GEO measurement loop

## Why

The SEO observatory measured every week but its data never reached `main`:
the workflow opened a new PR per run from a new branch
(`auto/seo-observatory-<run id>`), five were open (#1200, #1208, #1231,
#1251, #1257), and each held a different week of the append-only
`timeseries/*.jsonl`, so merging any one of them would drop the others' weeks
from the next run's base. The workflow also fell back to `GITHUB_TOKEN` when
the PAT was missing, which leaves the PR's required checks pending.

The site did not use IndexNow, so Bing (which feeds Copilot and ChatGPT
search) learned about changed pages only on its own crawl schedule.

Umami had no event for the Chrome extension install link, and there was no
agreed way to read visits sent by AI assistants. The AI-visibility probe asked
five developer questions only; the audit's 10-prompt panel (athlete and
developer, EN and ES) was not measured, and the dashboard had no monthly view.

## What Changes

- `scripts/geo/union-timeseries.mjs` union-merges another ref's
  `reports/seo/` into the working tree without losing a line from either side.
  The five open weekly PRs were merged with it in this change.
- `seo-observatory.yml` keeps one rolling PR on the fixed branch
  `auto/seo-observatory`: it requires `SEO_OBSERVATORY_PR_TOKEN` (fails
  otherwise), unions the branch's data before collecting, rebuilds the branch
  from `main`, force-pushes with a lease, and edits the open PR or opens one.
  The workflow token drops to `contents: read`.
- IndexNow: a key file at the landing root, and `scripts/geo/indexnow.mjs`.
  The deploy build diffs the live sitemaps against the built ones; a new
  `indexnow` job submits the changed URLs after the smoke, logs the status,
  skips when nothing changed and only warns on errors.
- Landing: `extension-install-clicked` with `{ extension: <slug> }`.
- AI referrers: `reports/seo/umami-ai-referrers.md` documents a saved Umami
  report over the referrer and UTM data Umami already records. No new event.
- `queries.json` adds the 10 panel prompts in EN and ES; the probe records
  `lang` and a `byLang` split; the dashboard gains "Monthly AI visibility".
- The privacy policy already discloses "anonymous page views and product
  events" (2026-09-27); an install click with a listing slug is such an
  event, so it is unchanged.

## Impact

- Affected specs: `analytics-port` (MODIFIED "Landing tracks key funnel
  events").
- The deploy build timeout goes from 3 to 4 minutes (arithmetic in the
  workflow comment).
- After merge the five weekly PRs are superseded and closed by the
  maintainer; future snapshots arrive on the rolling PR.
