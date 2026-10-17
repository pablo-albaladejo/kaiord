// Tests for .claude/hooks/check-architecture.cjs using node:test.

import { strict as assert } from "node:assert";
import { createRequire } from "node:module";
import { describe, test } from "node:test";

const require = createRequire(import.meta.url);
const {
  findViolations,
  isRelevantCoreFile,
} = require("./check-architecture.cjs");

describe("isRelevantCoreFile (path filter)", () => {
  test("should match a repo-root-relative core/src path with no leading slash", () => {
    // Arrange
    const file = "packages/core/src/domain/workout.ts";

    // Act
    const result = isRelevantCoreFile(file);

    // Assert
    assert.equal(result, true);
  });

  test("should reject the same path with a leading slash (git never emits one)", () => {
    // Arrange
    const file = "/packages/core/src/domain/workout.ts";

    // Act
    const result = isRelevantCoreFile(file);

    // Assert
    assert.equal(result, false);
  });

  test("should reject a file outside packages/core/src/", () => {
    // Arrange
    const file = "packages/fit/src/adapters/fit-reader.ts";

    // Act
    const result = isRelevantCoreFile(file);

    // Assert
    assert.equal(result, false);
  });

  test("should reject a non-.ts file under packages/core/src/", () => {
    // Arrange
    const file = "packages/core/src/domain/README.md";

    // Act
    const result = isRelevantCoreFile(file);

    // Assert
    assert.equal(result, false);
  });

  test("should reject a path where packages/core/src/ is nested, not rooted", () => {
    // Arrange
    const file = "vendor/packages/core/src/domain/workout.ts";

    // Act
    const result = isRelevantCoreFile(file);

    // Assert
    assert.equal(result, false);
  });
});

describe("findViolations (domain layer)", () => {
  test("should flag a domain file importing from adapters", () => {
    // Arrange
    const file = "packages/core/src/domain/workout.ts";
    const content = "import { x } from '../adapters/logger';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Domain cannot import from adapters/);
  });

  test("should flag a domain file importing from application", () => {
    // Arrange
    const file = "packages/core/src/domain/workout.ts";
    const content = "import { x } from '../application/use-case';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Domain cannot import from application/);
  });

  test("should flag a domain file importing @garmin", () => {
    // Arrange
    const file = "packages/core/src/domain/power.ts";
    const content = "import { fitsdk } from '@garmin/fitsdk';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Domain cannot import @garmin/);
  });

  test("should flag a domain file importing fast-xml-parser", () => {
    // Arrange
    const file = "packages/core/src/domain/power.ts";
    const content = "import { XMLParser } from 'fast-xml-parser';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Domain cannot import fast-xml-parser/);
  });

  test("should pass a clean domain file", () => {
    // Arrange
    const file = "packages/core/src/domain/power.ts";
    const content = "import { z } from 'zod';\nexport type Power = number;\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 0);
  });
});

describe("findViolations (application layer)", () => {
  test("should flag an application file importing from adapters", () => {
    // Arrange
    const file = "packages/core/src/application/convert.ts";
    const content = "import { x } from '../adapters/logger';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Application cannot import from adapters/);
  });

  test("should flag an application file importing @garmin", () => {
    // Arrange
    const file = "packages/core/src/application/convert.ts";
    const content = "import { fitsdk } from '@garmin/fitsdk';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 1);
    assert.match(violations[0], /Application cannot import @garmin/);
  });

  test("should not flag a ports file with the same bad import", () => {
    // Arrange
    const file = "packages/core/src/ports/logger.ts";
    const content = "import { fitsdk } from '@garmin/fitsdk';\n";

    // Act
    const violations = findViolations(file, content);

    // Assert
    assert.equal(violations.length, 0);
  });
});
