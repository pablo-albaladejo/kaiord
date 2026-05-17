import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { checkStranglerExpiry } from "./check-strangler-expiry.mjs";

const FUTURE = "2099-01-01";
const PAST = "2000-01-01";

describe("checkStranglerExpiry", () => {
  describe("no marker", () => {
    it("returns no errors when file has no strangler-until comment", () => {
      const errors = checkStranglerExpiry(
        "export const x = 1;\nexport const y = 2;\n",
        "src/foo.ts"
      );
      assert.deepEqual(errors, []);
    });
  });

  describe("future date", () => {
    it("returns no errors when strangler-until is in the future", () => {
      const errors = checkStranglerExpiry(
        `// @strangler-until: ${FUTURE}\nexport const x = 1;\n`,
        "src/foo.ts"
      );
      assert.deepEqual(errors, []);
    });
  });

  describe("past date", () => {
    it("flags an expired strangler-until marker", () => {
      const errors = checkStranglerExpiry(
        `// @strangler-until: ${PAST}\nexport const x = 1;\n`,
        "src/foo.ts"
      );
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("has passed"));
      assert.ok(errors[0].includes("src/foo.ts:1"));
    });
  });

  describe("malformed date", () => {
    it("flags a non-YYYY-MM-DD date", () => {
      const errors = checkStranglerExpiry(
        `// @strangler-until: tomorrow\nexport const x = 1;\n`,
        "src/foo.ts"
      );
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("malformed"));
    });
  });

  describe("multiple markers", () => {
    it("flags each expired marker independently", () => {
      const errors = checkStranglerExpiry(
        `// @strangler-until: ${PAST}\nconst a = 1;\n// @strangler-until: ${PAST}\nconst b = 2;\n`,
        "src/foo.ts"
      );
      assert.equal(errors.length, 2);
      assert.ok(errors[0].includes("src/foo.ts:1"));
      assert.ok(errors[1].includes("src/foo.ts:3"));
    });
  });
});
