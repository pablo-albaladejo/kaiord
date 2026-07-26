# SEO/GEO observatory data

Weekly measurement for kaiord.com. Collectors in `scripts/geo/` write one
entry per day to `timeseries/*.jsonl`; `DASHBOARD.md` is generated — never edit
it by hand. Full guide: [`docs/seo-observatory.md`](../../docs/seo-observatory.md).

| File                    | What                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `DASHBOARD.md`          | Generated summary — the weekly review surface.             |
| `queries.json`          | Tracked SERP queries, AI questions, competitor match list. |
| `directory-status.json` | Manual GEO entity / directory presence checklist.          |
| `timeseries/*.jsonl`    | Append-only daily time series (one entry per source/day).  |
| `snapshots/*.json`      | Full raw payload per collector run.                        |

Collectors are idempotent per day (a second run on the same date is a no-op),
so local runs and the weekly workflow can overlap safely.
