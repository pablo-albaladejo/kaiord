# SEO/GEO Observatory

A lightweight, self-hosted measurement loop for how discoverable kaiord.com is
on classic search (Google, Bing) and on generative answer engines (Perplexity,
ChatGPT Search / Copilot via the Bing index). It ports the pattern used by
sibling projects: stdlib-only Node collectors append time series under
`reports/seo/`, a generated dashboard makes trends reviewable in the repo, and a
weekly GitHub Actions job keeps one rolling metrics PR up to date for the owner
to review.

Nothing here touches the product packages — it lives in `scripts/geo/`,
`reports/seo/`, and `.github/workflows/seo-observatory.yml`, plus the IndexNow
step of `.github/workflows/deploy-site.yml` (see [IndexNow](#indexnow)).

## Why "GEO" too

Answer engines cite what their index already trusts. Bing's index feeds ChatGPT
Search and Copilot, so Bing coverage is the hard gate for GEO visibility
regardless of on-page quality. The observatory therefore tracks both classic
ranking signals and whether AI answers actually mention or cite kaiord.

## Collectors

| Script                    | Source                       | Needs                                    | Day-one?  |
| ------------------------- | ---------------------------- | ---------------------------------------- | --------- |
| `serp-snapshot.mjs`       | DuckDuckGo HTML (≈ Bing)     | nothing (keyless)                        | ✅ yes    |
| `ai-visibility-probe.mjs` | Perplexity / OpenAI          | `PERPLEXITY_API_KEY` or `OPENAI_API_KEY` | ✅ if key |
| `bing-snapshot.mjs`       | Bing Webmaster Tools API     | `BING_WEBMASTER_API_KEY`                 | ⏳ later  |
| `gsc-snapshot.mjs`        | Google Search Console API    | `GSC_SERVICE_ACCOUNT_JSON`               | ⏳ later  |
| `seo-dashboard.mjs`       | the time series above        | nothing                                  | ✅ yes    |
| `union-timeseries.mjs`    | another ref's `reports/seo/` | nothing (git)                            | ✅ yes    |
| `rolling-pr.mjs`          | GitHub pulls API             | `gh` token (workflow's)                  | ✅ yes    |

Every collector **no-ops gracefully when its credential is absent**, so the
weekly workflow is green from day one. kaiord has no GSC property and is likely
not yet in Bing Webmaster Tools, so initially only the SERP snapshot and (if a
Perplexity key is present) the AI-visibility probe produce data.

There is deliberately **no crawler-log collector**: the site is served from
GitHub Pages, which exposes no server-side access logs to mine for AI-bot hits.

## Cadence

`.github/workflows/seo-observatory.yml` runs Mondays 07:37 UTC (and on
`workflow_dispatch`). Reviewing the `DASHBOARD.md` diff is the weekly SEO
review. Local runs are idempotent per day:

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

## The rolling PR

There is **one** metrics PR, from the fixed branch `auto/seo-observatory`,
labeled `seo` / `automated`. Each run:

1. checks out `main` with full history and `persist-credentials: false` (the
   repository is public, so reading needs no credential);
2. `scripts/geo/rolling-pr.mjs plan` reads the branch SHA and looks for the
   open rolling PR with the workflow token. Only a PR whose head is the branch
   **in this repository** counts: a fork can open a PR from a branch with the
   same name, and `gh pr list --head` would match it;
3. only while that PR is open, merges the branch's data into the working tree
   with `scripts/geo/union-timeseries.mjs --branch origin/auto/seo-observatory`.
   A PR closed unmerged means its data was rejected, and a deleted branch has
   nothing to restore: in both cases the run starts from `main`, so rejected
   weeks do not come back every week;
4. runs the collectors, regenerates the dashboard, and uploads `reports/seo/`
   as the run's artifact (`seo-observatory-<run id>`, 90 days), so a week's
   data survives a failed push;
5. recreates the branch from `main` with the result and pushes it with
   `--force-with-lease` pinned to the SHA from step 2 (empty when the branch
   does not exist). If the push is refused (the branch moved, or was deleted,
   or its PR closed meanwhile), the run plans again, rebuilds the branch on
   the current `main`, merges the rolling branch only if its PR is still open,
   adds this run's own records (those newer than a mark taken before the
   collectors ran: `union-timeseries.mjs --branch <ours> --since <mark>`), and
   pushes once more. Then it updates the open PR's body, or opens the PR if
   none is open.

`SEO_OBSERVATORY_PR_TOKEN` is read by the publish step only, and reaches git
as a one-shot `http.extraheader`, never `.git/config`: no collector and no
merge step can read it.

So the PR always merges cleanly, holds every week not yet on `main`, and can be
merged at any time; the next run starts a new PR from the same branch.

Merge semantics (`union-timeseries.mjs`, tested in
`union-timeseries.test.mjs`): each `timeseries/*.jsonl` record is one
measurement, identified by `(date, source, provider)`. **Main wins**: a record
`main` already has is kept as `main` has it, even when the branch holds an older
copy, so a line corrected on `main` never comes back. The branch adds only the
keys `main` lacks. The result is stably sorted by `date`. A line that is not
JSON is kept verbatim at the end and reported as a `::warning::`.
`snapshots/*.json` missing on `main` are copied from the branch; one already on
`main` is never overwritten. A ref without any timeseries file is an error.

The same script merged the weekly PRs opened before the rolling branch
existed (one branch per run, `auto/seo-observatory-<run id>`):

```bash
for b in $(gh pr list --repo pablo-albaladejo/kaiord --state open \
    --search "head:auto/seo-observatory-" --json headRefName -q '.[].headRefName'); do
  git fetch origin "+refs/heads/${b}:refs/remotes/origin/${b}"
  node scripts/geo/union-timeseries.mjs --branch "origin/${b}"
done
node scripts/geo/seo-dashboard.mjs
```

## KPI denominators

"Pages indexed on Google" is `indexed / sitemapUrlCount` from the GSC
collector, and the sitemap is its denominator. On 2026-09-28 the docs sitemap
dropped from 374 to 37 URLs (API symbol pages became `noindex,follow`; PR
#1268), so the denominator falls from 377 to about 40 from the next GSC run
on. The ratio jumps without any indexing change: compare `indexed` counts, not
ratios, across that date.

**AI mention rate (2026-09-28).** The brand prompts (`brand: true` in
`queries.json`: `panel-07-en`/`-es`, "What is Kaiord?") name kaiord in the
question, so every answer mentions it. They are counted apart (`brand` in each
row) and left out of `questions`, `kaiordMentions`, `mentionRate`,
`citedCount` and `byLang`. `mentionRate` covers the rest of the panel. The
dashboard's KPI row uses `core.mentionRate`: the 5 `core: true` prompts every
row since 2026-07-22 was measured on, so the KPI stays comparable across the
panel's arrival (for rows from before it, the overall rate is the core rate).
Rows without `byLang` asked English prompts only and count as EN in the
monthly view.

**What "mentioned" means.** A run is `kaiordMentioned` when its answer text or
any of its cited URLs contains "kaiord", the same test the probe applies to
competitors. An answer that only cites a `@kaiord/*` package page (for example
on libraries.io) therefore counts: that happened for `ts-fit-lib` on
2026-08-24, 2026-08-31 and 2026-09-14. `kaiordCited` is narrower, a
`kaiord.com` URL among the citations. The raw answers and citations stay in
each snapshot, so a text-only rate can be recomputed from them if the
definition ever changes; it would then have to change for competitors too.

## AI visibility panel (J3/J4)

`aiQuestions` in `reports/seo/queries.json` holds the original five discovery
questions plus the audit's 10-prompt panel in English and Spanish
(`panel-01-en` … `panel-10-es`). Every question carries `lang`; the probe
records it per run and a `byLang` split per entry. The dashboard's "Monthly AI
visibility" section rolls the weekly probe rows up per provider and month,
with the EN and ES halves. The questions are asked once each by the same
probe: there is no second pipeline. `panel-07` ("What is Kaiord?") names the
brand, so it is left out of every rate (see "KPI denominators"); read its
answers for what they say.

Visits that AI assistants send are read in Umami, not here: see
[`reports/seo/umami-ai-referrers.md`](../reports/seo/umami-ai-referrers.md).

## IndexNow

`scripts/geo/indexnow.mjs` tells IndexNow engines (Bing, which feeds Copilot
and ChatGPT search; Yandex; Seznam; Naver) which URLs a deploy changed. Google
ignores IndexNow and reads the sitemap `lastmod`.

- The key is `packages/landing/public/<key>.txt`, whose content is the key. It
  is public by design: serving it at `https://kaiord.com/<key>.txt` proves
  ownership. Rotate it by replacing the file (a new `openssl rand -hex 16`).
- `deploy-site.yml` build job: diffs the built `sitemap-landing.xml` and
  `docs/sitemap.xml` by `<loc>` and `<lastmod>` (added, removed and re-dated
  URLs) against the **baseline**: the sitemaps of the last deploy whose
  submit succeeded, kept in the Actions cache (`indexnow-baseline-*`). URLs a
  failed fetch or a failed submit missed are therefore sent by the next
  deploy. Without a baseline (the first run, or the cache evicted after 7
  days unused) it diffs against the live sitemaps, fetched from kaiord.com. A
  set counts only if every file is present and lists at least one URL; with
  neither, the deploy skips with a warning rather than submit the whole site.
  It uploads the list and the built sitemaps.
- `indexnow` job, after the deploy smoke: an empty list logs `IndexNow:
nothing changed, skipping`; otherwise one POST to `api.indexnow.org` and
  `IndexNow <status> for <n> URL(s)`. 200/202 succeed; any other status, or a
  request aborted after 20s, is a warning. Only a success, or nothing to
  send, saves the built sitemaps as the next baseline; after a warning the
  baseline stays put and the next deploy resends these URLs. The job is
  `continue-on-error`, so it never turns a deploy red.

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
4. **Rolling PR token (required)** — `SEO_OBSERVATORY_PR_TOKEN`, a
   fine-grained PAT scoped to this repo with _Contents_ and _Pull requests_
   write. The workflow pushes and edits the PR with it (publish step only), and
   **fails on its first step when it is missing**. A push made with the
   default `github.token` does not trigger `pull_request` workflows, so the
   PR's required checks would stay pending and it could never merge (the
   2026-07-24 smoke-run needed a manual approve plus an empty retrigger
   commit to land). When the PAT expires, the weekly run goes red until it is
   renewed.

The GEO entity checklist lives in `reports/seo/directory-status.json` — update
it as MCP-registry, npm, and directory listings go live.
