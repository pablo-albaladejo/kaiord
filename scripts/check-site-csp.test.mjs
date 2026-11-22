import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkSiteCsp } from "./check-site-csp.mjs";

const INLINE = "window.x=1;";
const HASH = `'sha256-${createHash("sha256").update(INLINE).digest("base64")}'`;

const meta = (policy) =>
  `<meta http-equiv="Content-Security-Policy" content="${policy}">`;

const SAFE = `default-src 'none'; script-src 'self' ${HASH}; object-src 'none'; base-uri 'none'`;

const page = (head) =>
  `<!doctype html><html><head><meta charset="UTF-8">${head}<title>x</title></head><body></body></html>`;

describe("check-site-csp", () => {
  let site;

  const put = (path, html) => {
    const file = join(site, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  };

  beforeEach(() => {
    site = mkdtempSync(join(tmpdir(), "site-csp-"));
    put("index.html", page(`${meta(SAFE)}<script>${INLINE}</script>`));
    put("app/index.html", page(`${meta(SAFE)}<script>${INLINE}</script>`));
  });

  afterEach(() => {
    rmSync(site, { recursive: true, force: true });
  });

  it("should accept pages whose policy hashes every inline script", () => {
    assert.deepEqual(checkSiteCsp(site), []);
  });

  it("should flag a landing or App page served without a policy", () => {
    put("es/index.html", page(`<script>${INLINE}</script>`));
    put("app/index.html", page(""));

    assert.deepEqual(checkSiteCsp(site), [
      "app/index.html: no Content-Security-Policy meta",
      "es/index.html: no Content-Security-Policy meta",
    ]);
  });

  it("should judge the docs pages like every other page", () => {
    put("docs/index.html", page("<script>1</script>"));
    put("docs/guide/start.html", page(`${meta(SAFE)}<script>2</script>`));

    assert.deepEqual(checkSiteCsp(site), [
      "docs/guide/start.html: inline script #1 is not in script-src",
      "docs/index.html: no Content-Security-Policy meta",
    ]);
  });

  for (const source of [
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'unsafe-hashes'",
    "*",
    "https:",
    "http:",
    "data:",
    "blob:",
    "https://*.example.com",
  ]) {
    it(`should flag ${source} as a script source`, () => {
      put(
        "index.html",
        page(
          `${meta(SAFE.replace("script-src 'self'", `script-src 'self' ${source}`))}<script>${INLINE}</script>`
        )
      );

      assert.deepEqual(checkSiteCsp(site), [
        `index.html: unsafe script source ${source}`,
      ]);
    });
  }

  it("should judge default-src as the script policy when script-src is absent", () => {
    put(
      "index.html",
      page(meta("default-src *; object-src 'none'; base-uri 'none'"))
    );

    assert.deepEqual(checkSiteCsp(site), [
      "index.html: unsafe script source *",
    ]);
  });

  it("should flag a policy without object-src 'none' or base-uri", () => {
    put("index.html", page(meta(`script-src 'self' ${HASH}`)));
    put("app/index.html", page(meta(SAFE)));

    assert.deepEqual(checkSiteCsp(site), [
      "index.html: object-src is not 'none'",
      "index.html: no base-uri",
    ]);
  });

  it("should flag an inline script the policy does not hash", () => {
    put("index.html", page(`${meta(SAFE)}<script>window.y=2;</script>`));

    assert.deepEqual(checkSiteCsp(site), [
      "index.html: inline script #1 is not in script-src",
    ]);
  });

  it("should ignore JSON-LD data blocks and external scripts", () => {
    put(
      "index.html",
      page(
        `${meta(SAFE)}<script type="application/ld+json">{"a":1}</script><script type="module" src="/a.js"></script>`
      )
    );

    assert.deepEqual(checkSiteCsp(site), []);
  });

  it("should flag a script that runs before the policy is parsed", () => {
    put("index.html", page(`<script>${INLINE}</script>${meta(SAFE)}`));

    assert.deepEqual(checkSiteCsp(site), [
      "index.html: a script precedes the Content-Security-Policy meta",
    ]);
  });
});
