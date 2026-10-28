import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LINK_HEADER,
  handle,
  markdownPathFor,
  prefersMarkdown,
} from "./agent-edge-worker.mjs";

const ORIGIN = "https://kaiord.com";
const BROWSER_ACCEPT =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

// A fake GitHub Pages origin: path -> [status, content-type, body].
const fakeOrigin = (routes) => {
  const seen = [];
  const originFetch = async (request) => {
    const { pathname } = new URL(request.url);
    seen.push(`${request.method} ${pathname}`);
    const [status, type, body] = routes[pathname] ?? [404, "text/html", "nf"];
    return new Response(body, {
      status,
      headers: { "content-type": type, "cache-control": "max-age=600" },
    });
  };
  return { originFetch, seen };
};

const SITE = {
  "/": [200, "text/html; charset=utf-8", "<h1>Kaiord</h1>"],
  "/llms.txt": [200, "text/plain; charset=utf-8", "# Kaiord\n\n> map"],
  "/docs/formats/krd": [200, "text/html; charset=utf-8", "<h1>KRD</h1>"],
  "/docs/formats/krd.md": [200, "text/markdown", "# KRD Format"],
  "/docs/guide/missing": [200, "text/html; charset=utf-8", "<h1>x</h1>"],
  "/robots.txt": [200, "text/plain", "User-agent: *"],
};

const get = (path, accept, method = "GET") =>
  new Request(`${ORIGIN}${path}`, { method, headers: { accept } });

describe("agent-edge-worker", () => {
  it("should map landing, docs index and docs pages to their markdown", () => {
    assert.equal(markdownPathFor("/"), "/llms.txt");
    assert.equal(markdownPathFor("/es/"), "/llms.txt");
    assert.equal(markdownPathFor("/docs/"), "/docs/llms.txt");
    assert.equal(markdownPathFor("/docs/formats/krd"), "/docs/formats/krd.md");
    assert.equal(markdownPathFor("/docs/guide/"), null);
    assert.equal(markdownPathFor("/docs/assets/app.js"), null);
    assert.equal(markdownPathFor("/app/"), null);
  });

  it("should prefer markdown only when it is named and not ranked below html", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("text/markdown, text/html;q=0.5"), true);
    assert.equal(prefersMarkdown("text/html, text/markdown;q=0.5"), false);
    assert.equal(prefersMarkdown("text/markdown;q=0"), false);
    assert.equal(prefersMarkdown(BROWSER_ACCEPT), false);
    assert.equal(prefersMarkdown(null), false);
  });

  it("should serve the landing as markdown when an agent asks for it", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(get("/", "text/markdown"), originFetch);

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      "text/markdown; charset=utf-8"
    );
    assert.equal(response.headers.get("vary"), "Accept");
    assert.equal(response.headers.get("link"), LINK_HEADER);
    assert.equal(response.headers.get("x-markdown-tokens"), "4");
    assert.equal(response.headers.get("cache-control"), "max-age=600");
    assert.equal(await response.text(), "# Kaiord\n\n> map");
  });

  it("should serve a docs page from its published .md twin", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(
      get("/docs/formats/krd", "text/markdown"),
      originFetch
    );

    assert.equal(await response.text(), "# KRD Format");
  });

  it("should fall back to the html when the markdown twin is missing", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(
      get("/docs/guide/missing", "text/markdown"),
      originFetch
    );

    assert.match(response.headers.get("content-type"), /^text\/html/);
    assert.equal(response.headers.get("link"), LINK_HEADER);
    assert.equal(await response.text(), "<h1>x</h1>");
  });

  it("should give a browser the html with link and vary headers", async () => {
    const { originFetch, seen } = fakeOrigin(SITE);

    const response = await handle(get("/", BROWSER_ACCEPT), originFetch);

    assert.equal(await response.text(), "<h1>Kaiord</h1>");
    assert.equal(response.headers.get("link"), LINK_HEADER);
    assert.equal(response.headers.get("vary"), "Accept");
    assert.deepEqual(seen, ["GET /"]);
  });

  it("should pass non-html responses through untouched", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(get("/robots.txt", "*/*"), originFetch);

    assert.equal(response.headers.get("link"), null);
    assert.equal(await response.text(), "User-agent: *");
  });

  it("should answer HEAD for markdown with headers and no body", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(
      get("/", "text/markdown", "HEAD"),
      originFetch
    );

    assert.match(response.headers.get("content-type"), /^text\/markdown/);
    assert.equal(await response.text(), "");
  });

  it("should forward other methods to the origin unchanged", async () => {
    const { originFetch, seen } = fakeOrigin(SITE);

    await handle(get("/", "text/markdown", "POST"), originFetch);

    assert.deepEqual(seen, ["POST /"]);
  });
});
