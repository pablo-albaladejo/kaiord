import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { htmlUnits } from "./claims-html.mjs";
import { SITE_CSP, serializePolicy } from "./site-csp-policy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

// The landing's data statement names, for every remote origin a page of the
// site may reach, the destination it is. The policy is the complete list of
// remote origins (nothing else can be fetched, framed or run), so a new
// origin fails here until the statement says where that data goes.
const DESTINATION = {
  "https://cloud.umami.is": "Umami",
  "https://gateway.umami.is": "Umami",
  "https://api.anthropic.com": "Anthropic",
  "https://api.openai.com": "OpenAI",
  "https://generativelanguage.googleapis.com": "Google",
  "https://www.googleapis.com": "Google Drive",
  "https://accounts.google.com": "Google Drive",
  "https://intervals.icu": "intervals.icu",
};
const STATEMENT = /^Your training and health data lives in IndexedDB/;

const HASH = "'sha256-a4ayc/80/OGda4BO/1o/V0etpOqiLx1JwB5S3beHW0s='";

describe("site-csp-policy", () => {
  it("should add the page's hashes to script-src only", () => {
    const policy = serializePolicy(
      { "script-src": ["'self'"], "object-src": ["'none'"] },
      [HASH]
    );

    assert.equal(policy, `script-src 'self' ${HASH}; object-src 'none'`);
  });

  for (const [surface, directives] of Object.entries(SITE_CSP)) {
    it(`should name the ${surface}'s remote origins over https only`, () => {
      const sources = Object.values(directives).flat();

      const loose = sources.filter(
        (source) =>
          !/^'(self|none|unsafe-inline)'$/.test(source) &&
          source !== "data:" &&
          !/^https:\/\/[a-z0-9.-]+(\/[\w./-]*)?$/.test(source)
      );

      assert.deepEqual(loose, []);
    });
  }

  it("should name in the landing's data statement, English and Spanish, the destination of every remote origin the site allows", () => {
    // Arrange
    const origins = new Set(
      Object.values(SITE_CSP)
        .flatMap((directives) => Object.values(directives).flat())
        .filter((source) => source.startsWith("https://"))
        .map((source) => new URL(source).origin)
    );
    const english = htmlUnits(read("packages/landing/index.html")).find((u) =>
      STATEMENT.test(u)
    );
    const spanish = JSON.parse(read("packages/landing/i18n/es.json"))[english];

    // Act
    const unnamed = [...origins].filter((o) => !DESTINATION[o]);
    const missing = [...origins].flatMap((o) =>
      [english, spanish]
        .filter((text) => !text?.includes(DESTINATION[o] ?? o))
        .map((text) => `${o} in ${text?.slice(0, 30)}`)
    );

    // Assert
    assert.deepEqual(unnamed, []);
    assert.deepEqual(missing, []);
    assert.match(english, /only to destinations you set up/);
    assert.match(english, /Separately, every page loads Umami analytics/);
  });
});
