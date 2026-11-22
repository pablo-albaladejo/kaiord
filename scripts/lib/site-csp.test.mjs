import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inlineScriptHashes, withCsp } from "./site-csp.mjs";
import { SITE_CSP } from "./site-csp-policy.mjs";

// sha256("1") in base64, computed with `printf 1 | openssl dgst -sha256 -binary | base64`.
const HASH_OF_1 = "'sha256-a4ayc/80/OGda4BO/1o/V0etpOqiLx1JwB5S3beHW0s='";
const HASH_OF_2 = "'sha256-1HNeOiZeFu7gP1lxi5tdAwGcB9i2xR+Q2jpmbuwTqzU='";
// The same for `a="</scripts>";`.
const HASH_OF_SCRIPTS_STRING =
  "'sha256-cAXCYmKeOIHOP0Pxf0mziQ8YMou46LLGu3ZYvQOY9PY='";

const PAGE = `<!doctype html><html><head>
    <script>1</script>
    <meta charset="UTF-8" />
    <script type="application/ld+json">{"a":1}</script>
    <script type="module" src="/a.js"></script>
  </head><body></body></html>`;

describe("site-csp", () => {
  it("should hash only inline executable scripts", () => {
    assert.deepEqual(inlineScriptHashes(PAGE), [HASH_OF_1]);
  });

  it("should end a script at any end tag the HTML spec accepts", () => {
    // A browser ends script data at `</script` followed by whitespace, `/`
    // or `>`, attributes and all; a missed end tag merges two scripts into
    // one hash and leaves the second one's own hash out of the policy.
    const page = "<script>1</script\t\n bar><script>2</SCRIPT/>";

    const hashes = inlineScriptHashes(page);

    assert.deepEqual(hashes, [HASH_OF_1, HASH_OF_2]);
  });

  it("should not end a script at a tag that only starts with script", () => {
    const page = '<script>a="</scripts>";</script>';

    const hashes = inlineScriptHashes(page);

    assert.deepEqual(hashes, [HASH_OF_SCRIPTS_STRING]);
  });

  it("should put the charset, then the policy, ahead of every script", () => {
    const html = withCsp(PAGE, SITE_CSP.landing);

    const head = html.slice(html.indexOf("<head>"));
    assert.match(
      head,
      /^<head>\n {4}<meta charset="UTF-8" \/>\n {4}<meta http-equiv="Content-Security-Policy" content="[^"]+" \/>\n {4}<script>1<\/script>/
    );
    assert.equal(html.match(/charset=/g).length, 1);
  });

  it("should replace a policy already present instead of adding a second", () => {
    const once = withCsp(PAGE, SITE_CSP.landing);

    const twice = withCsp(
      once.replace("<script>1</script>", "<script>2</script>"),
      SITE_CSP.app
    );

    assert.equal(twice.match(/Content-Security-Policy/g).length, 1);
    assert.ok(twice.includes("https://api.anthropic.com"));
    assert.ok(!twice.includes(HASH_OF_1));
  });

  it("should refuse a page with no head", () => {
    assert.throws(() => withCsp("<p>x</p>", SITE_CSP.landing), /no <head>/);
  });
});
