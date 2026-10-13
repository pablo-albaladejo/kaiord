// Per-session evidence for failed verify:prod checks: URL timeline, failed
// requests and console/page errors. Printed only when a check fails.
import { oneLine } from "./lib.mjs";

const ASSET_PATH = /\/app\/assets\/[^/?#]+-[\w-]{6,}\.[a-z0-9]+(?:[?#]|$)/i;

export function isHashedAsset(url) {
  return ASSET_PATH.test(url);
}

export function createEvidence(startedAt, now = Date.now) {
  const evidence = { navigations: [], failedRequests: [], errors: [] };
  const at = () => now() - startedAt;
  return {
    evidence,
    navigation(url) {
      evidence.navigations.push({ ms: at(), url });
    },
    response(status, url) {
      if (status >= 400) evidence.failedRequests.push({ what: status, url });
    },
    requestFailed(url, text) {
      evidence.failedRequests.push({ what: text ?? "failed", url });
    },
    console(text) {
      evidence.errors.push(`console: ${oneLine(text)}`);
    },
    pageError(message) {
      evidence.errors.push(`pageerror: ${oneLine(message)}`);
    },
  };
}

export function attachEvidence(page, collector) {
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) collector.navigation(f.url());
  });
  page.on("response", (r) => collector.response(r.status(), r.url()));
  page.on("requestfailed", (r) =>
    collector.requestFailed(r.url(), r.failure()?.errorText)
  );
  page.on("console", (m) => {
    if (m.type() === "error") collector.console(m.text());
  });
  page.on("pageerror", (e) => collector.pageError(e.message));
}

// The hashed entry script of the deployed index.html, so a failure can be
// tied to the exact build the run started against.
export async function readEntryScript(base, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(`${base}/`);
    if (!res.ok) return "unknown";
    const html = await res.text();
    const m = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/);
    return m ? m[1] : "unknown";
  } catch {
    return "unknown";
  }
}
