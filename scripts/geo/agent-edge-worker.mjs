// Cloudflare Worker in front of the GitHub Pages origin for kaiord.com.
// Pages cannot set response headers, so this edge adds the two things an
// agent looks for in a response: RFC 8288 Link headers pointing at the
// discovery documents, and a Markdown body when the request asks for
// `Accept: text/markdown`. Everything else passes through untouched.
// Deploy: scripts/geo/wrangler.toml (route kaiord.com/*).

export const LINK_HEADER = [
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '</docs/>; rel="service-doc"',
].join(", ");

const CONTENT_SIGNAL = "ai-train=yes, search=yes, ai-input=yes";
const CHARS_PER_TOKEN = 4;

// The landing has no per-page Markdown, but llms.txt is its Markdown map;
// every docs page is published next to its HTML as `<page>.md`.
export function markdownPathFor(pathname) {
  if (pathname === "/" || pathname === "/es/") return "/llms.txt";
  if (pathname === "/docs/") return "/docs/llms.txt";
  if (!pathname.startsWith("/docs/")) return null;
  // A directory index `/docs/x/` is published as `/docs/x.md`.
  const page = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const last = page.slice(page.lastIndexOf("/") + 1);
  return last.includes(".") ? null : `${page}.md`;
}

// RFC 9110 §12.5.1: the most specific matching range decides the quality.
const rangesFor = (type) => [type, `${type.split("/")[0]}/*`, "*/*"];

const qualityOf = (accept, type, { wildcards = true } = {}) => {
  const ranges = wildcards ? rangesFor(type) : [type];
  const found = new Map();
  for (const part of accept.split(",")) {
    const [media, ...params] = part.trim().split(";");
    const range = media.trim().toLowerCase();
    if (!ranges.includes(range) || found.has(range)) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    found.set(range, q ? Number(q.slice(2)) : 1);
  }
  const match = ranges.find((range) => found.has(range));
  return match ? found.get(match) : 0;
};

// Markdown only when it is asked for by name and not ranked below HTML, so a
// browser's `text/html,…,*/*` never receives it.
export function prefersMarkdown(accept) {
  const header = accept ?? "";
  const markdown = qualityOf(header, "text/markdown", { wildcards: false });
  return markdown > 0 && markdown >= qualityOf(header, "text/html");
}

const withHeaders = (response, extra) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

async function markdownResponse(request, path, originFetch) {
  const url = new URL(path, request.url);
  const source = await originFetch(new Request(url, { method: "GET" }));
  if (!source.ok) return null;
  const body = await source.text();
  const headers = {
    "content-type": "text/markdown; charset=utf-8",
    vary: "Accept",
    link: LINK_HEADER,
    "content-signal": CONTENT_SIGNAL,
    "x-markdown-tokens": String(Math.ceil(body.length / CHARS_PER_TOKEN)),
  };
  const cacheControl = source.headers.get("cache-control");
  if (cacheControl) headers["cache-control"] = cacheControl;
  const isHead = request.method === "HEAD";
  return new Response(isHead ? null : body, { status: 200, headers });
}

export async function handle(request, originFetch = fetch) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return originFetch(request);
  }
  const path = markdownPathFor(new URL(request.url).pathname);
  if (path && prefersMarkdown(request.headers.get("accept"))) {
    const markdown = await markdownResponse(request, path, originFetch);
    if (markdown) return markdown;
  }
  const response = await originFetch(request);
  const type = response.headers.get("content-type") ?? "";
  if (!type.startsWith("text/html")) return response;
  const extra = { link: LINK_HEADER };
  if (path) extra.vary = "Accept";
  return withHeaders(response, extra);
}

export default { fetch: (request) => handle(request) };
