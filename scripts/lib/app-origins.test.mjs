import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { APP_ORIGIN, DEV_ORIGINS, matchPattern } from "./app-origins.mjs";

const envelope = readFileSync(
  new URL(
    "../../packages/_shared/bridge-core/bridge-envelope.js",
    import.meta.url
  ),
  "utf8"
);

const constant = (name) => {
  const match = new RegExp(`const ${name} = ([^;]+);`).exec(envelope);
  assert.ok(match, `bridge-envelope.js no longer declares ${name}`);
  return JSON.parse(match[1]);
};

test("should hold the same App origin as the gate the bridges ship", () => {
  // Arrange
  const shipped = constant("APP_ORIGIN");

  // Act
  const shared = APP_ORIGIN;

  // Assert
  assert.equal(shared, shipped);
  assert.equal(shared, "https://kaiord.com");
});

test("should hold the same dev origins as the gate the bridges ship", () => {
  // Arrange
  const shipped = constant("DEV_ORIGINS");

  // Act
  const shared = DEV_ORIGINS;

  // Assert
  assert.deepEqual(shared, shipped);
});

test("should turn an origin into the match pattern for all its pages", () => {
  // Arrange
  const origin = "http://localhost:5173";

  // Act
  const pattern = matchPattern(origin);

  // Assert
  assert.equal(pattern, "http://localhost:5173/*");
});
