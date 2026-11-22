import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SITE_CSP, serializePolicy } from "./site-csp-policy.mjs";

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
});
