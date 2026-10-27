import type { FullConfig } from "@playwright/test";

// Transform the whole module graph once, before any worker starts.
//
// A cold dev server transforms each module on its first request. With several
// workers booting the app at once, a lazy route took ~10 s to resolve, which
// is the whole action timeout, so the first test on each worker failed while
// a warm rerun passed. Playwright starts `webServer` before global setup, so
// the server is up here. The crawl follows every static and dynamic import
// the server rewrites to a same-origin path, lazy routes included, and only
// returns once each one has been served. Unlike Vite's `server.warmup`, it is
// awaited, so no test can start against a half-transformed graph.

const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["'](\/[^"']+)["']/g;
const SCRIPT_SRC = /<script[^>]+src="(\/[^"]+)"/g;
const CONCURRENCY = 8;
// A dependency first seen mid-crawl makes Vite re-optimize and answer 504 for
// the old dependency URLs; the next pass walks the new graph.
const MAX_PASSES = 3;
// A request the server never answers fails the setup instead of hanging it.
const REQUEST_TIMEOUT_MS = 60_000;

const specifiers = (source: string, pattern: RegExp): string[] =>
  [...source.matchAll(pattern)].map((match) => match[1]);

type Visit = { imports: string[]; stale: boolean };

// Every failure names the URL and what came back, and fails global setup: a
// warmup that gave up quietly would bring the cold flake back unseen.
async function load(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new Error(`warmup: ${url} failed: ${(error as Error).name}`, {
      cause: error,
    });
  }
}

async function visit(origin: string, path: string): Promise<Visit> {
  const response = await load(origin + path);
  if (response.status === 504) return { imports: [], stale: true };
  if (!response.ok) {
    throw new Error(`warmup: ${origin + path} answered ${response.status}`);
  }
  return { imports: specifiers(await response.text(), IMPORT), stale: false };
}

async function crawl(
  origin: string
): Promise<{ count: number; stale: string[] }> {
  const root = await load(`${origin}/`);
  if (!root.ok) throw new Error(`warmup: ${origin}/ answered ${root.status}`);
  const seen = new Set(specifiers(await root.text(), SCRIPT_SRC));
  if (seen.size === 0)
    throw new Error(`warmup: no module script in ${origin}/`);
  let frontier = [...seen];
  const stale: string[] = [];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (let i = 0; i < frontier.length; i += CONCURRENCY) {
      const batch = frontier.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((path) => visit(origin, path))
      );
      for (const [index, result] of results.entries()) {
        if (result.stale) stale.push(origin + batch[index]);
        for (const path of result.imports) {
          if (seen.has(path)) continue;
          seen.add(path);
          next.push(path);
        }
      }
    }
    frontier = next;
  }
  return { count: seen.size, stale };
}

export default async function warmDevServer(config: FullConfig): Promise<void> {
  const origin = config.projects[0]?.use.baseURL;
  if (!origin) throw new Error("warmup: no baseURL in the Playwright config");
  const started = Date.now();
  let stale: string[] = [];
  for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
    const result = await crawl(origin);
    stale = result.stale;
    if (stale.length === 0) {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`Dev server warm: ${result.count} modules in ${seconds}s`);
      return;
    }
  }
  throw new Error(
    `warmup: still 504 after ${MAX_PASSES} passes: ${stale.slice(0, 5).join(", ")}`
  );
}
