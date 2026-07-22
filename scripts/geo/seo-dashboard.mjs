#!/usr/bin/env node
// Renders reports/seo/DASHBOARD.md from the observatory time series so trends
// are reviewable in the repo (and in the weekly PR diff) without tooling.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadQueries,
  readJsonl,
  seoDir,
  timeseriesDir,
} from "./observatory-lib.mjs";

const gsc = readJsonl(join(timeseriesDir, "gsc.jsonl"));
const bing = readJsonl(join(timeseriesDir, "bing.jsonl"));
const serp = readJsonl(join(timeseriesDir, "serp.jsonl"));
const aiVisibility = readJsonl(join(timeseriesDir, "ai-visibility.jsonl"));
const { serpQueries } = loadQueries();
const directoryStatus = JSON.parse(
  readFileSync(join(seoDir, "directory-status.json"), "utf8")
);

const latest = (rows) => rows.at(-1);
const previous = (rows) => rows.at(-2);

const fmt = (value) =>
  value === null || value === undefined ? "—" : String(value);
const delta = (current, prior) => {
  if (
    current === null ||
    current === undefined ||
    prior === null ||
    prior === undefined
  )
    return "";
  const diff = current - prior;
  if (diff === 0) return " (=)";
  return diff > 0
    ? ` (+${Math.round(diff * 100) / 100})`
    : ` (${Math.round(diff * 100) / 100})`;
};

const g = latest(gsc);
const gPrev = previous(gsc);
const b = latest(bing);
const bPrev = previous(bing);
const s = latest(serp);
const sPrev = previous(serp);

// One row per (date, provider); keep the newest entry for each provider.
const latestByProvider = new Map();
for (const row of aiVisibility) latestByProvider.set(row.provider, row);
const aiRows = [...latestByProvider.values()];

const lines = [];
lines.push("# SEO/GEO Dashboard — kaiord.com");
lines.push("");
lines.push(
  `_Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by \`scripts/geo/seo-dashboard.mjs\`. Do not edit by hand._`
);
lines.push("");
lines.push("## KPIs");
lines.push("");
lines.push("| Metric | Current | Target | Source |");
lines.push("| --- | --- | --- | --- |");
lines.push(
  `| Pages indexed on Google | ${g ? `${g.indexed}/${g.sitemapUrlCount}${delta(g.indexed, gPrev?.indexed)}` : "— (needs GSC creds)"} | all pages | gsc.jsonl |`
);
lines.push(
  `| Google impressions (7d) | ${g ? `${g.impressions}${delta(g.impressions, gPrev?.impressions)}` : "—"} | growing | gsc.jsonl |`
);
lines.push(
  `| Google clicks (7d) | ${g ? `${g.clicks}${delta(g.clicks, gPrev?.clicks)}` : "—"} | growing | gsc.jsonl |`
);
lines.push(
  `| Google avg position | ${g ? `${fmt(g.position)}${delta(gPrev?.position, g.position)}` : "—"} | top 10 on 3+ non-brand queries | gsc.jsonl |`
);
lines.push(
  `| Bing pages in index | ${b ? `${fmt(b.inIndexPages)}${delta(b.inIndexPages, bPrev?.inIndexPages)}` : "— (needs Bing key)"} | all pages | bing.jsonl |`
);
lines.push(
  `| Bing impressions (7d) | ${b ? `${b.impressions7d}${delta(b.impressions7d, bPrev?.impressions7d)}` : "—"} | growing | bing.jsonl |`
);
lines.push(
  `| Tracked queries where site appears (DDG/Bing proxy) | ${s ? `${s.found}/${s.queries}${delta(s.found, sPrev?.found)}` : "—"} | ${serpQueries.length}/${serpQueries.length} | serp.jsonl |`
);
lines.push(
  `| AI answer-engine mention rate | ${aiRows.length === 0 ? "— (needs Perplexity/OpenAI key)" : aiRows.map((r) => `${r.provider} ${r.mentionRate ?? "—"}`).join(", ")} | growing | ai-visibility.jsonl |`
);
lines.push("");

lines.push("## Tracked query positions (DDG — Bing-index proxy)");
lines.push("");
if (serp.length === 0) {
  lines.push(
    "_No SERP snapshots yet — run `node scripts/geo/serp-snapshot.mjs`._"
  );
} else {
  lines.push("| Query | Position | Prev | History (last 5) |");
  lines.push("| --- | --- | --- | --- |");
  for (const { id, q } of serpQueries) {
    const history = serp
      .map((row) => row.positions?.[id])
      .filter((p) => p !== undefined);
    const current = history.at(-1) ?? null;
    const prior = history.at(-2) ?? null;
    const spark = history
      .slice(-5)
      .map((p) => (p === null ? "·" : `#${p}`))
      .join(" ");
    lines.push(
      `| ${q} | ${current === null ? "ABSENT" : `#${current}`} | ${prior === null ? "ABSENT" : `#${prior}`} | ${spark} |`
    );
  }
}
lines.push("");

lines.push("## Top Google queries (latest GSC window)");
lines.push("");
if (g === undefined || (g.topQueries ?? []).length === 0) {
  lines.push("_No GSC query data yet (needs credentials and impressions)._");
} else {
  lines.push("| Query | Clicks | Impressions | Position |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of g.topQueries) {
    lines.push(
      `| ${row.query} | ${row.clicks} | ${row.impressions} | ${row.position} |`
    );
  }
}
lines.push("");

lines.push("## AI answer-engine visibility (GEO end-goal)");
lines.push("");
if (aiRows.length === 0) {
  lines.push(
    "_No AI-visibility data yet — run `node scripts/geo/ai-visibility-probe.mjs` (needs `PERPLEXITY_API_KEY` or `OPENAI_API_KEY`)._"
  );
} else {
  lines.push("| Provider | Date | Mentions | Rate | Cited | Top competitors |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of aiRows) {
    const comp = (r.topCompetitors ?? [])
      .map((c) => `${c.name} (${c.count})`)
      .join(", ");
    lines.push(
      `| ${r.provider} | ${r.date} | ${r.kaiordMentions}/${r.questions} | ${fmt(r.mentionRate)} | ${r.citedCount} | ${comp || "—"} |`
    );
  }
}
lines.push("");

lines.push("## Directory / entity presence (GEO substrate)");
lines.push("");
lines.push(
  `_Last manual check: ${directoryStatus.checkedAt}. Update \`reports/seo/directory-status.json\` when a listing goes live._`
);
lines.push("");
for (const [name, status] of Object.entries(directoryStatus.directories)) {
  lines.push(
    `- [${status.present ? "x" : " "}] ${name}${status.url ? ` — ${status.url}` : ""}`
  );
}
lines.push("");

writeFileSync(join(seoDir, "DASHBOARD.md"), `${lines.join("\n")}\n`);
console.log(`[dashboard] wrote reports/seo/DASHBOARD.md`);
