/**
 * Kaiord Bridge Core — Request gate unit tests (vendored)
 *
 * Master: packages/_shared/bridge-core/test/bridge-request-gate.test.js.
 * Never edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 */
import { describe, expect, it } from "vitest";

const {
  createRequestGate,
  matchesShape,
} = require("../bridge-request-gate.js");

const ALLOWED = [
  { method: "GET", pattern: /^\/items\/\d+$/ },
  { method: "POST", pattern: /^\/items$/, body: "item" },
  { method: "DELETE", pattern: /^\/items\/\d+$/ },
];

const BODY_SCHEMAS = {
  item: {
    type: "object",
    fields: {
      name: { type: "string", max: 10 },
      day: { type: "date" },
      note: { type: "string", optional: true, nullable: true },
    },
  },
};

const admit = createRequestGate({
  allowed: ALLOWED,
  bodySchemas: BODY_SCHEMAS,
});

const refusalOf = (message) => {
  try {
    admit(message);
    return null;
  } catch (e) {
    return e;
  }
};

describe("bridge-core request gate (vendored)", () => {
  it("should admit a listed method and path with nothing else", () => {
    // Arrange
    const message = { action: "request", method: "GET", path: "/items/7" };

    // Act
    const admitted = admit(message);

    // Assert
    expect(admitted).toEqual({ method: "GET", path: "/items/7" });
  });

  it.each([
    ["an unlisted path", { action: "request", method: "GET", path: "/other" }],
    [
      "a listed path with another method",
      { action: "request", method: "PUT", path: "/items/7" },
    ],
    [
      "a header",
      { action: "request", method: "GET", path: "/items/7", headers: {} },
    ],
    [
      "a body on an entry that takes none",
      { action: "request", method: "DELETE", path: "/items/7", body: {} },
    ],
    [
      "no body on an entry that needs one",
      { action: "request", method: "POST", path: "/items" },
    ],
    [
      "a body with an undeclared key",
      {
        action: "request",
        method: "POST",
        path: "/items",
        body: { name: "a", day: "2026-01-02", extra: 1 },
      },
    ],
    [
      "a body missing a declared key",
      {
        action: "request",
        method: "POST",
        path: "/items",
        body: { name: "a" },
      },
    ],
    [
      "a body with a wrong type",
      {
        action: "request",
        method: "POST",
        path: "/items",
        body: { name: 3, day: "2026-01-02" },
      },
    ],
    [
      "a body with a date that does not exist",
      {
        action: "request",
        method: "POST",
        path: "/items",
        body: { name: "a", day: "2026-02-30" },
      },
    ],
    [
      "a string over its declared length",
      {
        action: "request",
        method: "POST",
        path: "/items",
        body: { name: "abcdefghijk", day: "2026-01-02" },
      },
    ],
    [
      "a path that is not a string",
      { action: "request", method: "GET", path: 7 },
    ],
  ])("should refuse %s without a retry", (_label, message) => {
    // Arrange
    const request = message;

    // Act
    const err = refusalOf(request);

    // Assert
    expect(err?.message).toBe("Request not allowed");
    expect(err?.retryable).toBe(false);
  });

  it("should admit a body that matches its declared schema", () => {
    // Arrange
    const body = { name: "run", day: "2026-01-02", note: null };

    // Act
    const admitted = admit({
      action: "request",
      method: "POST",
      path: "/items",
      body,
    });

    // Assert
    expect(admitted).toEqual({ method: "POST", path: "/items", body });
  });

  it("should refuse an entry whose body schema is not declared", () => {
    // Arrange
    const gate = createRequestGate({
      allowed: [{ method: "POST", pattern: /^\/x$/, body: "missing" }],
      bodySchemas: {},
    });

    // Act
    const act = () =>
      gate({ action: "request", method: "POST", path: "/x", body: {} });

    // Assert
    expect(act).toThrow("Request not allowed");
  });

  it.each([
    [{ type: "bytes", min: 2, max: 3 }, [0, 255], true],
    [{ type: "bytes", min: 2, max: 3 }, [0, 256], false],
    [{ type: "bytes", min: 2, max: 3 }, [1, 2, 3, 4], false],
    [
      { type: "array", items: { type: "integer", min: 1 }, min: 1 },
      [1, 2],
      true,
    ],
    [{ type: "array", items: { type: "integer", min: 1 }, min: 1 }, [], false],
    [{ type: "literal", value: 0 }, 0, true],
    [{ type: "literal", value: 0 }, 1, false],
    [{ type: "number" }, Number.NaN, false],
    [{ type: "boolean" }, false, true],
    [{ type: "json", maxChars: 20 }, { a: [1, "b", null] }, true],
    [{ type: "json", maxChars: 5 }, { a: [1, "b", null] }, false],
    [{ type: "anyOf", of: [{ type: "string" }, { type: "integer" }] }, 3, true],
    [{ type: "custom", test: (v) => v === "ok" }, "ok", true],
  ])("should match %j against %j as %s", (shape, value, expected) => {
    // Arrange
    const subject = value;

    // Act
    const matched = matchesShape(subject, shape);

    // Assert
    expect(matched).toBe(expected);
  });
});
