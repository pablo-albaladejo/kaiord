#!/usr/bin/env node
// Records where kaiord.com ranks for the tracked query set
// (reports/seo/queries.json) using DuckDuckGo's HTML endpoint. DDG results
// derive largely from Bing's index, so this is a Bing-side proxy that needs no
// API key and can run weekly in CI without secrets. Google positions come from
// gsc-snapshot.mjs (real Search Console data), not from here.
import { join } from "node:path";
import {
  appendJsonl,
  loadQueries,
  sleep,
  timeseriesDir,
  todayIso,
  writeSnapshot,
} from "./observatory-lib.mjs";

const TARGET = "kaiord.com";
// A browser-like UA avoids the endpoint's bot heuristics for this low-volume,
// widely-spaced query pattern.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// DDG's HTML endpoint wraps result links as /l/?uddg=<encoded-target-url>.
const resultUrls = (html) =>
  Array.from(
    html.matchAll(/class="result__a"[^>]*href="([^"]+)"/g),
    (m) => m[1]
  )
    .map((href) => {
      const uddg = /[?&]uddg=([^&]+)/.exec(href)?.[1];
      return uddg ? decodeURIComponent(uddg) : href;
    })
    .filter((url) => url.startsWith("http"));

const search = async (query, lang) => {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      q: query,
      kl: lang === "es" ? "es-es" : "us-en",
    }),
  });
  if (!response.ok) return undefined;
  return resultUrls(await response.text());
};

const { serpQueries } = loadQueries();
const results = [];
for (const { id, q, lang } of serpQueries) {
  const urls = await search(q, lang);
  if (urls === undefined) {
    console.warn(`[serp] blocked or failed for "${q}" — recording null`);
    results.push({ id, q, position: null, blocked: true, top: [] });
  } else {
    const index = urls.findIndex((url) => domainOf(url).endsWith(TARGET));
    results.push({
      id,
      q,
      position: index === -1 ? null : index + 1,
      blocked: false,
      top: urls.slice(0, 5).map(domainOf),
    });
  }
  await sleep(2500);
}

const found = results.filter((r) => r.position !== null).length;
const entry = {
  date: todayIso(),
  source: "serp-ddg",
  queries: results.length,
  found,
  positions: Object.fromEntries(results.map((r) => [r.id, r.position])),
};

writeSnapshot(`serp-${todayIso()}`, { entry, results });
const appended = appendJsonl(join(timeseriesDir, "serp.jsonl"), entry);
console.log(
  `[serp] ${appended ? "recorded" : "already recorded today"}: found in ${found}/${results.length} tracked queries`
);
for (const r of results) {
  console.log(
    `  ${r.position === null ? (r.blocked ? "BLOCKED" : "ABSENT ") : `#${r.position}`.padEnd(7)} ${r.q}`
  );
}
