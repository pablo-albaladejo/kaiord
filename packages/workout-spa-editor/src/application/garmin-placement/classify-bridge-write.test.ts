import { describe, expect, it } from "vitest";

import { classifyBridgeWrite, type WriteClass } from "./classify-bridge-write";
import type { BridgeFailure } from "./garmin-calendar-port";

const ok: WriteClass = { kind: "ok" };
const ambiguous: WriteClass = { kind: "ambiguous" };
const definite = (reason: string) =>
  ({ kind: "definite", reason }) as WriteClass;

const CASES: Array<[string, { ok: true } | BridgeFailure, WriteClass]> = [
  ["a 2xx", { ok: true }, ok],
  ["400", { ok: false, status: 400 }, definite("schedule-rejected")],
  ["403", { ok: false, status: 403 }, definite("schedule-rejected")],
  ["409", { ok: false, status: 409 }, definite("schedule-rejected")],
  ["404", { ok: false, status: 404 }, definite("not-found")],
  [
    "401 with needsReauth",
    { ok: false, status: 401, needsReauth: true },
    definite("needs-reauth"),
  ],
  [
    "needsReauth with no status",
    { ok: false, needsReauth: true },
    definite("needs-reauth"),
  ],
  [
    "a refusal with retryable:false",
    { ok: false, retryable: false, error: "bad input" },
    definite("schedule-rejected"),
  ],
  [
    "deadline-before-send",
    { ok: false, retryable: true, error: "deadline-before-send" },
    definite("deadline-before-send"),
  ],
  [
    "delivered:false",
    { ok: false, delivered: false, error: "Extension did not respond" },
    ambiguous,
  ],
  [
    "delivered:false with needsReauth",
    { ok: false, delivered: false, needsReauth: true },
    ambiguous,
  ],
  ["deadline-exceeded", { ok: false, error: "deadline-exceeded" }, ambiguous],
  ["no status and no error", { ok: false }, ambiguous],
  ["500", { ok: false, status: 500 }, ambiguous],
  ["502", { ok: false, status: 502 }, ambiguous],
  ["503", { ok: false, status: 503 }, ambiguous],
  ["504", { ok: false, status: 504 }, ambiguous],
  ["429", { ok: false, status: 429, retryable: false }, ambiguous],
];

describe("classifyBridgeWrite", () => {
  it.each(CASES)("should classify %s", (_name, answer, expected) => {
    // Arrange
    const input = answer;

    // Act
    const cls = classifyBridgeWrite(input);

    // Assert
    expect(cls).toEqual(expected);
  });
});
