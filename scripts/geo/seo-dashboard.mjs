#!/usr/bin/env node
// Renders reports/seo/DASHBOARD.md from the observatory time series so trends
// are reviewable in the repo (and in the weekly PR diff) without tooling.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadQueries,
  readJsonl,
  seoDir,
  timeseriesDir,
  writeIfChanged,
} from "./observatory-lib.mjs";

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

const ratio = (num, den) =>
  den === 0 ? "—" : String(Number((num / den).toFixed(2)));

// The KPI rate: the 5 core prompts. Rows from before the panel (no `core`)
// were measured on exactly those 5, so their overall rate IS the core rate.
// A row whose core prompts all failed keeps `null`, never the panel rate.
export const coreRate = (row) =>
  row.core === undefined ? row.mentionRate : row.core.mentionRate;

export const KPI_DENOMINATORS = [
  "## KPI denominators",
  "",
  '_Since 2026-09-28:_ the AI mention-rate KPI is the **core** rate, over the 5 prompts every week has been measured on since 2026-07-22 (`core: true` in `queries.json`), so it stays comparable. The weekly table\'s **Rate** covers the whole panel. Brand prompts (`brand: true`, "What is Kaiord?") are left out of every rate: the question names kaiord.',
  "",
  "_Mentioned_ means the answer text **or one of its cited URLs** names kaiord (the same test as for competitors), so an answer that only cites a `@kaiord/*` package page counts. _Cited_ is narrower: a `kaiord.com` URL among the citations.",
  "",
];

// J3/J4: the probe runs weekly; this rolls its rows up per provider and
// calendar month, newest first, so month-over-month movement (and the EN/ES
// halves of the panel, from `byLang`) is readable at a glance.
export function monthlyAiVisibility(rows, months = 12) {
  const groups = new Map();
  for (const row of rows) {
    if (typeof row.date !== "string" || !row.provider) continue;
    const key = `${row.date.slice(0, 7)} ${row.provider}`;
    const g = groups.get(key) ?? {
      month: row.date.slice(0, 7),
      provider: row.provider,
      runs: 0,
      questions: 0,
      mentions: 0,
      cited: 0,
      byLang: {},
    };
    g.runs += 1;
    g.questions += row.questions ?? 0;
    g.mentions += row.kaiordMentions ?? 0;
    g.cited += row.citedCount ?? 0;
    // Rows from before the EN/ES panel (no byLang) asked English prompts only.
    const byLang = row.byLang ?? {
      en: { questions: row.questions, kaiordMentions: row.kaiordMentions },
    };
    for (const [lang, v] of Object.entries(byLang)) {
      g.byLang[lang] ??= { questions: 0, mentions: 0 };
      g.byLang[lang].questions += v.questions ?? 0;
      g.byLang[lang].mentions += v.kaiordMentions ?? 0;
    }
    groups.set(key, g);
  }
  const all = [...groups.values()].sort((a, b) =>
    a.month === b.month
      ? a.provider.localeCompare(b.provider)
      : b.month.localeCompare(a.month)
  );
  const recent = new Set(
    [...new Set(all.map((g) => g.month))].slice(0, months)
  );
  return all.filter((g) => recent.has(g.month));
}

export function renderMonthlyAiVisibility(rows) {
  const lines = ["## Monthly AI visibility", ""];
  const monthly = monthlyAiVisibility(rows);
  if (monthly.length === 0) {
    lines.push("_No AI-visibility data yet._", "");
    return lines;
  }
  lines.push(
    "| Month | Provider | Runs | Mentions | Rate | Cited | EN | ES |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  );
  for (const m of monthly) {
    const lang = (code) => {
      const v = m.byLang[code];
      return v ? `${v.mentions}/${v.questions}` : "—";
    };
    lines.push(
      `| ${m.month} | ${m.provider} | ${m.runs} | ${m.mentions}/${m.questions} | ${ratio(m.mentions, m.questions)} | ${m.cited} | ${lang("en")} | ${lang("es")} |`
    );
  }
  lines.push("");
  return lines;
}

export function renderDashboard({
  gsc,
  bing,
  serp,
  aiVisibility,
  serpQueries,
  directoryStatus,
  now = new Date(),
}) {
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
    `_Generated ${now.toISOString().slice(0, 16).replace("T", " ")} UTC by \`scripts/geo/seo-dashboard.mjs\`. Do not edit by hand._`
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
    `| AI answer-engine mention rate (core 5 prompts) | ${aiRows.length === 0 ? "— (needs Perplexity/OpenAI key)" : aiRows.map((r) => `${r.provider} ${fmt(coreRate(r))}`).join(", ")} | growing | ai-visibility.jsonl |`
  );
  lines.push("");
  lines.push(...KPI_DENOMINATORS);

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
    lines.push(
      "| Provider | Date | Mentions | Rate | Core rate | Cited | Top competitors |"
    );
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const r of aiRows) {
      const comp = (r.topCompetitors ?? [])
        .map((c) => `${c.name} (${c.count})`)
        .join(", ");
      lines.push(
        `| ${r.provider} | ${r.date} | ${r.kaiordMentions}/${r.questions} | ${fmt(r.mentionRate)} | ${fmt(coreRate(r))} | ${r.citedCount} | ${comp || "—"} |`
      );
    }
  }
  lines.push("");

  lines.push(...renderMonthlyAiVisibility(aiVisibility));

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

  return `${lines.join("\n")}\n`;
}

// Skip the write when nothing but the timestamp would change — a fresh
// _Generated line on every run makes the weekly workflow treat a no-op
// dashboard regeneration as a real metric change and open a noise PR.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wrote = writeIfChanged(
    join(seoDir, "DASHBOARD.md"),
    renderDashboard({
      gsc: readJsonl(join(timeseriesDir, "gsc.jsonl")),
      bing: readJsonl(join(timeseriesDir, "bing.jsonl")),
      serp: readJsonl(join(timeseriesDir, "serp.jsonl")),
      aiVisibility: readJsonl(join(timeseriesDir, "ai-visibility.jsonl")),
      serpQueries: loadQueries().serpQueries,
      directoryStatus: JSON.parse(
        readFileSync(join(seoDir, "directory-status.json"), "utf8")
      ),
    }),
    /^_Generated .+$/m
  );
  console.log(
    wrote
      ? `[dashboard] wrote reports/seo/DASHBOARD.md`
      : "[dashboard] no content change — leaving reports/seo/DASHBOARD.md untouched"
  );
}
