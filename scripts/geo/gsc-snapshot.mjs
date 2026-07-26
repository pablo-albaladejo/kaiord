#!/usr/bin/env node
// Pulls Google Search Console data for kaiord.com into reports/seo/:
// search analytics (clicks / impressions / average position by query and page)
// plus per-URL index coverage for every sitemap URL. Ground truth for "are we
// ranking on Google" — runs weekly via the seo-observatory workflow.
//
// kaiord has no GSC property yet, so with no credentials this no-ops. Once the
// property exists, set GSC_PROPERTY (default sc-domain:kaiord.com).
//
// Auth: a Google service account added as a user on the GSC property.
//   GSC_SERVICE_ACCOUNT_JSON       service-account key JSON, inline; or
//   GOOGLE_APPLICATION_CREDENTIALS path to the key file.
// Setup: docs/seo-observatory.md
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appendJsonl,
  fetchSitemapUrls,
  sleep,
  timeseriesDir,
  todayIso,
  writeSnapshot,
} from "./observatory-lib.mjs";

const property = process.env.GSC_PROPERTY ?? "sc-domain:kaiord.com";

const loadCredentials = () => {
  if (process.env.GSC_SERVICE_ACCOUNT_JSON)
    return JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(
      readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8")
    );
  }
  return undefined;
};

const credentials = loadCredentials();
if (!credentials) {
  console.log(
    "[gsc] no credentials (GSC_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS) — skipping. Setup: docs/seo-observatory.md"
  );
  process.exit(0);
}

const base64url = (input) => Buffer.from(input).toString("base64url");

const getAccessToken = async () => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: credentials.token_uri,
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(credentials.private_key, "base64url");
  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `token exchange failed: ${response.status} ${await response.text()}`
    );
  }
  return (await response.json()).access_token;
};

const token = await getAccessToken();

const api = async (url, body) => {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // A 403 means the credentials are valid but the service account is not yet a
  // user on the property — a setup state, not a code failure. kaiord has no GSC
  // property yet, so skip cleanly instead of failing the weekly run.
  if (response.status === 403) {
    console.warn(
      `[gsc] 403 from ${url} — the service account is not authorized on ${property}. ` +
        "Add the client_email from the GSC_SERVICE_ACCOUNT_JSON key under " +
        "Search Console → Settings → Users and permissions, then this collector will run. Skipping."
    );
    process.exit(0);
  }
  if (!response.ok)
    throw new Error(`${url} -> ${response.status} ${await response.text()}`);
  return response.json();
};

// Search-analytics data lags ~3 days; use the freshest complete 7-day window.
const end = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
const start = new Date(Date.now() - 9 * 86_400_000).toISOString().slice(0, 10);
const site = encodeURIComponent(property);
const analyticsUrl = `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`;

const totals = await api(analyticsUrl, { startDate: start, endDate: end });
const byQuery = await api(analyticsUrl, {
  startDate: start,
  endDate: end,
  dimensions: ["query"],
  rowLimit: 100,
});
const byPage = await api(analyticsUrl, {
  startDate: start,
  endDate: end,
  dimensions: ["page"],
  rowLimit: 100,
});
const sitemaps = await api(
  `https://www.googleapis.com/webmasters/v3/sites/${site}/sitemaps`
);

const sitemapUrls = await fetchSitemapUrls();
const inspections = [];
for (const url of sitemapUrls) {
  const result = await api(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    {
      inspectionUrl: url,
      siteUrl: property,
    }
  );
  const status = result.inspectionResult?.indexStatusResult ?? {};
  inspections.push({
    url,
    verdict: status.verdict ?? "UNKNOWN",
    coverageState: status.coverageState ?? null,
    lastCrawlTime: status.lastCrawlTime ?? null,
  });
  await sleep(250);
}
const indexed = inspections.filter((i) => i.verdict === "PASS").length;

const totalsRow = totals.rows?.[0] ?? {};
const entry = {
  date: todayIso(),
  source: "gsc",
  window: { start, end },
  clicks: totalsRow.clicks ?? 0,
  impressions: totalsRow.impressions ?? 0,
  ctr: totalsRow.ctr ?? 0,
  position:
    totalsRow.position === undefined
      ? null
      : Number(totalsRow.position.toFixed(1)),
  indexed,
  sitemapUrlCount: sitemapUrls.length,
  sitemapSubmitted: (sitemaps.sitemap ?? []).length > 0,
  topQueries: (byQuery.rows ?? []).slice(0, 10).map((row) => ({
    query: row.keys[0],
    clicks: row.clicks,
    impressions: row.impressions,
    position: Number(row.position.toFixed(1)),
  })),
};

writeSnapshot(`gsc-${todayIso()}`, {
  entry,
  byQuery: byQuery.rows ?? [],
  byPage: byPage.rows ?? [],
  sitemaps,
  inspections,
});
const appended = appendJsonl(join(timeseriesDir, "gsc.jsonl"), entry);
console.log(
  `[gsc] ${appended ? "recorded" : "already recorded today"}: ${indexed}/${sitemapUrls.length} indexed, ` +
    `${entry.impressions} impressions, ${entry.clicks} clicks (${start}..${end})`
);
if (!entry.sitemapSubmitted) {
  console.warn(
    "[gsc] WARNING: sitemap.xml is not submitted in Search Console — submit https://kaiord.com/sitemap.xml there."
  );
}
