#!/usr/bin/env node
// Pulls Bing Webmaster Tools stats for kaiord.com into reports/seo/.
// Bing's index feeds ChatGPT Search and Copilot, so Bing coverage is the
// hard gate for GEO visibility regardless of on-page quality.
//
// Auth: BING_WEBMASTER_API_KEY (Bing Webmaster Tools → Settings → API access).
// kaiord may not be verified in Bing Webmaster yet — with no key this no-ops.
// Setup: docs/seo-observatory.md
import { join } from "node:path";
import {
  appendJsonl,
  timeseriesDir,
  todayIso,
  writeSnapshot,
} from "./observatory-lib.mjs";

const apiKey = process.env.BING_WEBMASTER_API_KEY;
if (!apiKey) {
  console.log(
    "[bing] no BING_WEBMASTER_API_KEY — skipping. Setup: docs/seo-observatory.md"
  );
  process.exit(0);
}

const siteUrl = process.env.BING_SITE_URL ?? "https://kaiord.com";

const api = async (method) => {
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${method} -> ${response.status} ${await response.text()}`);
  return (await response.json()).d;
};

// Bing serializes dates as "/Date(1234567890000)/".
const parseBingDate = (value) =>
  new Date(Number(/\d+/.exec(String(value))?.[0] ?? 0))
    .toISOString()
    .slice(0, 10);

const traffic = (await api("GetRankAndTrafficStats")) ?? [];
const queries = (await api("GetQueryStats")) ?? [];
const crawl = (await api("GetCrawlStats")) ?? [];

const byDate = [...traffic].sort((a, b) =>
  parseBingDate(a.Date).localeCompare(parseBingDate(b.Date))
);
const last7 = byDate.slice(-7);
const sum = (rows, key) => rows.reduce((acc, row) => acc + (row[key] ?? 0), 0);
const latestCrawl = [...crawl]
  .sort((a, b) => parseBingDate(a.Date).localeCompare(parseBingDate(b.Date)))
  .at(-1);

const entry = {
  date: todayIso(),
  source: "bing",
  impressions7d: sum(last7, "Impressions"),
  clicks7d: sum(last7, "Clicks"),
  crawledPages: latestCrawl?.CrawledPages ?? null,
  inIndexPages: latestCrawl?.InIndexPages ?? null,
  crawlErrors: latestCrawl?.AllOtherCodes ?? null,
  topQueries: [...queries]
    .sort((a, b) => (b.Impressions ?? 0) - (a.Impressions ?? 0))
    .slice(0, 10)
    .map((row) => ({
      query: row.Query,
      clicks: row.Clicks ?? 0,
      impressions: row.Impressions ?? 0,
      position: row.AvgImpressionPosition ?? null,
    })),
};

writeSnapshot(`bing-${todayIso()}`, { entry, traffic, queries, crawl });
const appended = appendJsonl(join(timeseriesDir, "bing.jsonl"), entry);
console.log(
  `[bing] ${appended ? "recorded" : "already recorded today"}: ${entry.impressions7d} impressions / ` +
    `${entry.clicks7d} clicks (7d), inIndexPages=${entry.inIndexPages ?? "n/a"}`
);
