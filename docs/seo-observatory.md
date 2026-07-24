# SEO/GEO Observatory

A lightweight, self-hosted measurement loop for how discoverable kaiord.com is
on classic search (Google, Bing) and on generative answer engines (Perplexity,
ChatGPT Search / Copilot via the Bing index). It ports the pattern used by
sibling projects: stdlib-only Node collectors append time series under
`reports/seo/`, a generated dashboard makes trends reviewable in the repo, and a
weekly GitHub Actions job opens a metrics PR for the owner to review.

Nothing here touches the product packages — it lives entirely in
`scripts/geo/`, `reports/seo/`, and `.github/workflows/seo-observatory.yml`.

## Why "GEO" too

Answer engines cite what their index already trusts. Bing's index feeds ChatGPT
Search and Copilot, so Bing coverage is the hard gate for GEO visibility
regardless of on-page quality. The observatory therefore tracks both classic
ranking signals and whether AI answers actually mention or cite kaiord.

## Collectors

| Script                    | Source                    | Needs                                    | Day-one?  |
| ------------------------- | ------------------------- | ---------------------------------------- | --------- |
| `serp-snapshot.mjs`       | DuckDuckGo HTML (≈ Bing)  | nothing (keyless)                        | ✅ yes    |
| `ai-visibility-probe.mjs` | Perplexity / OpenAI       | `PERPLEXITY_API_KEY` or `OPENAI_API_KEY` | ✅ if key |
| `bing-snapshot.mjs`       | Bing Webmaster Tools API  | `BING_WEBMASTER_API_KEY`                 | ⏳ later  |
| `gsc-snapshot.mjs`        | Google Search Console API | `GSC_SERVICE_ACCOUNT_JSON`               | ⏳ later  |
| `seo-dashboard.mjs`       | the time series above     | nothing                                  | ✅ yes    |

Every collector **no-ops gracefully when its credential is absent**, so the
weekly workflow is green from day one. kaiord has no GSC property and is likely
not yet in Bing Webmaster Tools, so initially only the SERP snapshot and (if a
Perplexity key is present) the AI-visibility probe produce data.

There is deliberately **no crawler-log collector**: the site is served from
GitHub Pages, which exposes no server-side access logs to mine for AI-bot hits.

## Cadence

`.github/workflows/seo-observatory.yml` runs Mondays 07:37 UTC (and on
`workflow_dispatch`) and opens a metrics PR labeled `seo` / `automated`.
Reviewing the `DASHBOARD.md` diff is the weekly SEO review. Local runs are
idempotent per day:

```bash
node scripts/geo/serp-snapshot.mjs          # keyless (DDG = Bing proxy)
# optional, if you have keys in your environment:
export PERPLEXITY_API_KEY=...                # AI answer-engine probe
export BING_WEBMASTER_API_KEY=...            # once kaiord is verified in Bing
export GSC_SERVICE_ACCOUNT_JSON="$(cat sa.json)"   # once a GSC property exists
node scripts/geo/ai-visibility-probe.mjs
node scripts/geo/bing-snapshot.mjs
node scripts/geo/gsc-snapshot.mjs
node scripts/geo/seo-dashboard.mjs          # regenerate reports/seo/DASHBOARD.md
```

## Configuration

`reports/seo/queries.json` holds the tracked query set:

- `serpQueries` — brand + ownable-niche queries checked for kaiord's position.
- `aiQuestions` — buyer/discovery questions posed to answer engines.
- `competitors` — name + lowercased match tokens counted in AI answers.

Environment overrides (all optional):

| Var                | Default                          | Used by               |
| ------------------ | -------------------------------- | --------------------- |
| `GSC_PROPERTY`     | `sc-domain:kaiord.com`           | `gsc-snapshot`        |
| `GEO_SITEMAP_URL`  | `https://kaiord.com/sitemap.xml` | `gsc-snapshot`        |
| `BING_SITE_URL`    | `https://kaiord.com`             | `bing-snapshot`       |
| `PERPLEXITY_MODEL` | `sonar`                          | `ai-visibility-probe` |

## One-time setup (owner)

Repo secrets, added as they become available (the workflow skips each collector
until its secret exists):

1. **Perplexity** — add `PERPLEXITY_API_KEY` to enable the AI-visibility probe.
2. **Google Search Console** — verify a `sc-domain:kaiord.com` property, submit
   `https://kaiord.com/sitemap.xml`, then add a read-only service account as a
   user and store its key JSON as `GSC_SERVICE_ACCOUNT_JSON`.
3. **Bing Webmaster Tools** — import from GSC, then add
   `BING_WEBMASTER_API_KEY` (Settings → API access).
4. **Weekly PR token** — add `SEO_OBSERVATORY_PR_TOKEN`, a fine-grained PAT
   scoped to this repo with _Contents_ and _Pull requests_ write. With the
   default `github.token` the metrics PR is authored by `github-actions[bot]`:
   `pull_request` workflows never fire, the required "Check for Changeset"
   context stays `expected`, and code-owner review blocks the merge (the
   2026-07-24 smoke-run needed a manual approve plus an empty retrigger
   commit to land). Without the secret the workflow still runs and falls back
   to `github.token`; only the PR merge becomes manual.

The GEO entity checklist lives in `reports/seo/directory-status.json` — update
it as MCP-registry, npm, and directory listings go live.
