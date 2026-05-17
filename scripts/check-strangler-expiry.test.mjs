import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { checkStranglerExpiry } from "./check-strangler-expiry.mjs";

const FUTURE = "2099-01-01";
const PAST = "2000-01-01";

describe("checkStranglerExpiry", () => {
  describe("no marker", () => {
    it("should return no errors when file has no strangler-until comment", () => {
      // Arrange
      const src = "export const x = 1;\nexport const y = 2;\n";

      // Act
      const errors = checkStranglerExpiry(src, "src/foo.ts");

      // Assert
      assert.deepEqual(errors, []);
    });
  });

  describe("future date", () => {
    it("should return no errors when strangler-until is in the future", () => {
      // Arrange
      const src = `// @strangler-until: ${FUTURE}\nexport const x = 1;\n`;

      // Act
      const errors = checkStranglerExpiry(src, "src/foo.ts");

      // Assert
      assert.deepEqual(errors, []);
    });
  });

  describe("past date", () => {
    it("should flag an expired strangler-until marker", () => {
      // Arrange
      const src = `// @strangler-until: ${PAST}\nexport const x = 1;\n`;

      // Act
      const errors = checkStranglerExpiry(src, "src/foo.ts");

      // Assert
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("has passed"));
      assert.ok(errors[0].includes("src/foo.ts:1"));
    });
  });

  describe("malformed date", () => {
    it("should flag a non-YYYY-MM-DD date", () => {
      // Arrange
      const src = `// @strangler-until: tomorrow\nexport const x = 1;\n`;

      // Act
      const errors = checkStranglerExpiry(src, "src/foo.ts");

      // Assert
      assert.equal(errors.length, 1);
      assert.ok(errors[0].includes("malformed"));
    });
  });

  describe("multiple markers", () => {
    it("should flag each expired marker independently", () => {
      // Arrange
      const src = `// @strangler-until: ${PAST}\nconst a = 1;\n// @strangler-until: ${PAST}\nconst b = 2;\n`;

      // Act
      const errors = checkStranglerExpiry(src, "src/foo.ts");

      // Assert
      assert.equal(errors.length, 2);
      assert.ok(errors[0].includes("src/foo.ts:1"));
      assert.ok(errors[1].includes("src/foo.ts:3"));
    });
  });
});
