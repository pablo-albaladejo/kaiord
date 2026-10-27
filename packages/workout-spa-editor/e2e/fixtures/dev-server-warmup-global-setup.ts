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

// Both patterns scan what the dev server sends, already transformed: every
// import there is a rewritten absolute path, and a literal `from "/x"` that the
// server leaves unresolved 404s here on every run. Worker targets created with
// `new Worker(new URL(...))` are not crawled.
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["'](\/[^"']+)["']/g;
const SCRIPT_SRC = /<script[^>]+src="(\/[^"]+)"/g;
const CONCURRENCY = 8;
// A dependency first seen mid-crawl makes Vite re-optimize and answer 504 for
// the old dependency URLs; the next pass walks the new graph.
const MAX_PASSES = 3;
// A request the server never answers fails the setup instead of hanging it.
const REQUEST_TIMEOUT_MS = 30_000;
// What proves the crawl reached this SPA rather than another app the config
// reused on the same port: the entry `index.html` loads, and a graph of the
// right order (about 2200 modules today).
const ENTRY = "/src/main.tsx";
const MIN_MODULES = 1000;

const specifiers = (source: string, pattern: RegExp): string[] =>
  [...source.matchAll(pattern)].map((match) => match[1]);

type Visit = { imports: string[]; stale: boolean };

// Every failure names the URL and what came back, and fails global setup: a
// warmup that gave up quietly would bring the cold flake back unseen.
const fail = (message: string, cause?: unknown): never => {
  throw new Error(`warmup: ${message}`, { cause });
};

// undici puts the socket-level reason in `cause`. For localhost Node tries
// several addresses, so it is an AggregateError with an empty message that
// keeps the codes in `errors`.
type Cause = { code?: string; errors?: { code?: string }[] };
const reasonOf = (error: unknown): string => {
  const cause = (error as Error).cause as Cause | undefined;
  const code = cause?.code ?? cause?.errors?.[0]?.code;
  return code ?? String(cause ?? (error as Error).name);
};

const load = (url: string): Promise<Response> =>
  fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).catch(
    (error: unknown) => fail(`${url} failed: ${reasonOf(error)}`, error)
  );

async function visit(origin: string, path: string): Promise<Visit> {
  const response = await load(origin + path);
  if (response.status === 504) return { imports: [], stale: true };
  if (!response.ok) fail(`${origin + path} answered ${response.status}`);
  return { imports: specifiers(await response.text(), IMPORT), stale: false };
}

async function crawl(
  origin: string
): Promise<{ count: number; stale: string[] }> {
  const root = await load(`${origin}/`);
  if (!root.ok) fail(`${origin}/ answered ${root.status}`);
  const seen = new Set(specifiers(await root.text(), SCRIPT_SRC));
  if (!seen.has(ENTRY)) fail(`${origin}/ does not load ${ENTRY}: not this app`);
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
  if (!origin) return fail("no baseURL in the Playwright config");
  const started = Date.now();
  let stale: string[] = [];
  for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
    const result = await crawl(origin);
    stale = result.stale;
    if (stale.length === 0) {
      if (result.count < MIN_MODULES) {
        fail(`${origin}/ has ${result.count} modules, under ${MIN_MODULES}`);
      }
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`Dev server warm: ${result.count} modules in ${seconds}s`);
      return;
    }
  }
  fail(`still 504 after ${MAX_PASSES} passes: ${stale.slice(0, 5).join(", ")}`);
}
