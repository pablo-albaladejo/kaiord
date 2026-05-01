/**
 * Profile Snapshot Fixtures
 *
 * Shared positive/negative fixture set consumed by:
 * - The SPA's Zod parser tests (in `@kaiord/workout-spa-editor`).
 * - Each bridge's plain-JS structural validator parity test.
 *
 * Both validators MUST agree: positive fixtures parse with deep-equal
 * output; negative fixtures reject without throwing and without mutating
 * `Object.prototype`.
 */

import type { ProfileSnapshot } from "../types/profile-snapshot";

const ISO = "2026-05-01T08:30:00.000Z";

export const baselineSnapshot: ProfileSnapshot = {
  schemaVersion: 1,
  profile: { name: "Pablo", bodyWeight: 72 },
  activeSport: "cycling",
  thresholds: {
    cycling: { ftp: 270 },
    running: { thresholdPaceSecPerKm: 255, lthr: 168 },
  },
  heartRate: { max: 188, lthr: 168 },
  generatedAt: ISO,
};

export const minimalSnapshot: ProfileSnapshot = {
  schemaVersion: 1,
  profile: { name: "Min" },
  thresholds: {},
  heartRate: {},
  generatedAt: ISO,
};

export const partialZoneSnapshot: ProfileSnapshot = {
  schemaVersion: 1,
  profile: { name: "Partial" },
  activeSport: "running",
  thresholds: {
    running: { lthr: 170 },
  },
  heartRate: { max: 195 },
  generatedAt: ISO,
};

export const positiveSnapshotFixtures: readonly ProfileSnapshot[] = [
  baselineSnapshot,
  minimalSnapshot,
  partialZoneSnapshot,
];

const longName = "x".repeat(100);
const oversizedName = "x".repeat(9000);

export type NegativeSnapshotFixture = {
  readonly name: string;
  readonly value: unknown;
  readonly expectedError: RegExp;
};

const buildPrototypePolluted = (): unknown => {
  const obj = JSON.parse(
    `{"__proto__":{"isAdmin":true},"schemaVersion":1,"profile":{"name":"P"},"thresholds":{},"heartRate":{},"generatedAt":"${ISO}"}`
  ) as Record<string, unknown>;
  return obj;
};

const buildNestedPolluted = (): unknown => {
  const obj = JSON.parse(
    `{"schemaVersion":1,"profile":{"__proto__":{"isAdmin":true},"name":"P"},"thresholds":{},"heartRate":{},"generatedAt":"${ISO}"}`
  ) as Record<string, unknown>;
  return obj;
};

export const negativeSnapshotFixtures: readonly NegativeSnapshotFixture[] = [
  {
    name: "missing schemaVersion",
    value: { profile: { name: "x" }, generatedAt: ISO },
    expectedError: /schemaVersion/i,
  },
  {
    name: "unsupported schemaVersion",
    value: { schemaVersion: 99, profile: { name: "x" }, generatedAt: ISO },
    expectedError: /schemaVersion/i,
  },
  {
    name: "missing profile.name",
    value: { schemaVersion: 1, profile: {}, generatedAt: ISO },
    expectedError: /name/i,
  },
  {
    name: "empty profile.name",
    value: { schemaVersion: 1, profile: { name: "" }, generatedAt: ISO },
    expectedError: /name/i,
  },
  {
    name: "profile.name too long",
    value: {
      schemaVersion: 1,
      profile: { name: `${longName}x` },
      generatedAt: ISO,
    },
    expectedError: /name/i,
  },
  {
    name: "missing generatedAt",
    value: { schemaVersion: 1, profile: { name: "x" } },
    expectedError: /generatedAt/i,
  },
  {
    name: "non-positive bodyWeight",
    value: {
      schemaVersion: 1,
      profile: { name: "x", bodyWeight: 0 },
      generatedAt: ISO,
    },
    expectedError: /bodyWeight|positive/i,
  },
  {
    name: "unknown activeSport",
    value: {
      schemaVersion: 1,
      profile: { name: "x" },
      activeSport: "rowing",
      generatedAt: ISO,
    },
    expectedError: /activeSport|enum/i,
  },
  {
    name: "oversized payload",
    value: {
      schemaVersion: 1,
      profile: { name: oversizedName },
      generatedAt: ISO,
    },
    expectedError: /too large/i,
  },
  {
    name: "top-level prototype-pollution",
    value: buildPrototypePolluted(),
    expectedError: /(invalid|payload|__proto__|prototype)/i,
  },
  {
    name: "nested prototype-pollution",
    value: buildNestedPolluted(),
    expectedError: /(invalid|payload|__proto__|prototype)/i,
  },
];

export const snapshotFixtures = {
  positive: positiveSnapshotFixtures,
  negative: negativeSnapshotFixtures,
} as const;
