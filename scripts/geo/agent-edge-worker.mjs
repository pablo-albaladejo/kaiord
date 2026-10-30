// Cloudflare Worker in front of the GitHub Pages origin for kaiord.com.
// Pages cannot set response headers, so this edge adds what an agent looks
// for in a response: RFC 8288 Link headers pointing at the discovery
// documents, a Markdown body when the request asks for
// `Accept: text/markdown`, and the RFC 9727 media type on the extensionless
// api-catalog. Everything else passes through untouched.
// Deploy: scripts/geo/wrangler.toml (route kaiord.com/*).
import { prefersMarkdown } from "./accept-negotiation.mjs";

export { prefersMarkdown };

export const API_CATALOG_PATH = "/.well-known/api-catalog";

export const LINK_HEADER = [
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '</docs/>; rel="service-doc"',
  `<${API_CATALOG_PATH}>; rel="api-catalog"`,
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

// Pages serves the extensionless catalog with a generic type; only a 200
// is relabelled, so a missing file still reads as missing. RFC 9727 §2:
// a HEAD on the catalog carries the rel="api-catalog" Link header.
const apiCatalogResponse = (response) =>
  response.status === 200
    ? withHeaders(response, {
        "content-type": "application/linkset+json",
        "access-control-allow-origin": "*",
        link: LINK_HEADER,
      })
    : response;

export async function handle(request, originFetch = fetch) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return originFetch(request);
  }
  const pathname = new URL(request.url).pathname;
  if (pathname === API_CATALOG_PATH) {
    return apiCatalogResponse(await originFetch(request));
  }
  const path = markdownPathFor(pathname);
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
