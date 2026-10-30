import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  API_CATALOG_PATH,
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
    return new Response(request.method === "HEAD" ? null : body, {
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

const CATALOG_BODY = '{"linkset":[]}';
const CATALOG_SITE = {
  [API_CATALOG_PATH]: [200, "application/json", CATALOG_BODY],
};

const get = (path, accept, method = "GET") =>
  new Request(`${ORIGIN}${path}`, { method, headers: { accept } });

describe("agent-edge-worker", () => {
  it("should map landing, docs index and docs pages to their markdown", () => {
    assert.equal(markdownPathFor("/"), "/llms.txt");
    assert.equal(markdownPathFor("/es/"), "/llms.txt");
    assert.equal(markdownPathFor("/docs/"), "/docs/llms.txt");
    assert.equal(markdownPathFor("/docs/formats/krd"), "/docs/formats/krd.md");
    assert.equal(markdownPathFor("/docs/convert/"), "/docs/convert.md");
    assert.equal(markdownPathFor("/docs/es/"), "/docs/es.md");
    assert.equal(markdownPathFor("/docs/assets/app.js"), null);
    assert.equal(markdownPathFor("/app/"), null);
  });

  it("should keep exporting the markdown preference it negotiates with", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown(BROWSER_ACCEPT), false);
  });

  it("should relabel the api-catalog as a linkset with CORS", async () => {
    const { originFetch } = fakeOrigin(CATALOG_SITE);

    const response = await handle(get(API_CATALOG_PATH, "*/*"), originFetch);

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      "application/linkset+json"
    );
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(response.headers.get("cache-control"), "max-age=600");
    assert.equal(await response.text(), CATALOG_BODY);
  });

  it("should answer HEAD on the api-catalog with the type and no body", async () => {
    const { originFetch } = fakeOrigin(CATALOG_SITE);

    const response = await handle(
      get(API_CATALOG_PATH, "*/*", "HEAD"),
      originFetch
    );

    assert.equal(
      response.headers.get("content-type"),
      "application/linkset+json"
    );
    assert.equal(await response.text(), "");
  });

  it("should pass a missing api-catalog through untouched", async () => {
    const { originFetch } = fakeOrigin(SITE);

    const response = await handle(get(API_CATALOG_PATH, "*/*"), originFetch);

    assert.equal(response.status, 404);
    assert.equal(response.headers.get("content-type"), "text/html");
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });

  it("should only relabel the exact api-catalog path", async () => {
    const { originFetch } = fakeOrigin({
      [`${API_CATALOG_PATH}.json`]: [200, "application/json", "{}"],
      [`${API_CATALOG_PATH}/`]: [200, "application/json", "{}"],
    });

    const types = [];
    for (const path of [`${API_CATALOG_PATH}.json`, `${API_CATALOG_PATH}/`]) {
      const response = await handle(get(path, "*/*"), originFetch);
      types.push(response.headers.get("content-type"));
    }

    assert.deepEqual(types, ["application/json", "application/json"]);
  });

  it("should forward a POST to the api-catalog unchanged", async () => {
    const { originFetch, seen } = fakeOrigin(CATALOG_SITE);

    const response = await handle(
      get(API_CATALOG_PATH, "*/*", "POST"),
      originFetch
    );

    assert.deepEqual(seen, [`POST ${API_CATALOG_PATH}`]);
    assert.equal(response.headers.get("content-type"), "application/json");
  });

  it("should advertise the api-catalog in the link header", () => {
    assert.match(
      LINK_HEADER,
      /<\/\.well-known\/api-catalog>; rel="api-catalog"/
    );
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
