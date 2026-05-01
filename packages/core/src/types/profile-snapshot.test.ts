import { describe, expect, it } from "vitest";

import {
  fingerprintSnapshot,
  profileSnapshotSchema,
  STALE_SNAPSHOT_THRESHOLD_DAYS,
  type ProfileSnapshot,
} from "./profile-snapshot";
import {
  baselineSnapshot,
  negativeSnapshotFixtures,
  positiveSnapshotFixtures,
} from "../test-utils/profile-snapshot-fixtures";

describe("STALE_SNAPSHOT_THRESHOLD_DAYS", () => {
  it("is 7 days", () => {
    expect(STALE_SNAPSHOT_THRESHOLD_DAYS).toBe(7);
  });
});

describe("profileSnapshotSchema — positive fixtures", () => {
  it.each(positiveSnapshotFixtures)("accepts %#", (fixture) => {
    const result = profileSnapshotSchema.safeParse(fixture);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(fixture);
    }
  });

  it("accepts a partial-zone payload (running.lthr only)", () => {
    const partial: ProfileSnapshot = {
      schemaVersion: 1,
      profile: { name: "Partial" },
      activeSport: "running",
      thresholds: { running: { lthr: 170 } },
      heartRate: { max: 195 },
      generatedAt: "2026-05-01T00:00:00.000Z",
    };

    const result = profileSnapshotSchema.safeParse(partial);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.data.thresholds?.running?.thresholdPaceSecPerKm
      ).toBeUndefined();
      expect(result.data.thresholds?.running?.lthr).toBe(170);
      expect(result.data.heartRate?.lthr).toBeUndefined();
    }
  });
});

describe("profileSnapshotSchema — negative fixtures", () => {
  it.each(negativeSnapshotFixtures)(
    "rejects $name",
    ({ value, expectedError }) => {
      const result = profileSnapshotSchema.safeParse(value);

      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = JSON.stringify(result.error.issues);
        expect(formatted).toMatch(expectedError);
      }
    }
  );

  it("does not mutate Object.prototype when rejecting a poisoned payload", () => {
    const polluted = JSON.parse(
      `{"__proto__":{"isAdmin":true},"schemaVersion":1,"profile":{"name":"P"},"generatedAt":"2026-05-01T00:00:00.000Z"}`
    ) as unknown;

    profileSnapshotSchema.safeParse(polluted);

    expect(
      (Object.prototype as Record<string, unknown>).isAdmin
    ).toBeUndefined();
  });

  it("rejects payloads with circular references", () => {
    const circular: Record<string, unknown> = {
      schemaVersion: 1,
      profile: { name: "x" },
      generatedAt: "2026-05-01T00:00:00.000Z",
    };
    circular.self = circular;

    const result = profileSnapshotSchema.safeParse(circular);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toMatch(
        /invalid snapshot payload/i
      );
    }
  });

  it("rejects payloads whose JSON serialization exceeds 8192 code units", () => {
    const oversized = {
      schemaVersion: 1 as const,
      profile: { name: "x".repeat(9000) },
      thresholds: {},
      heartRate: {},
      generatedAt: "2026-05-01T00:00:00.000Z",
    };

    const result = profileSnapshotSchema.safeParse(oversized);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toMatch(/too large/i);
    }
  });
});

describe("fingerprintSnapshot", () => {
  it("returns 8-character lowercase hex", () => {
    const fp = fingerprintSnapshot("profile-1", baselineSnapshot);

    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic across calls", () => {
    const a = fingerprintSnapshot("profile-1", baselineSnapshot);
    const b = fingerprintSnapshot("profile-1", baselineSnapshot);

    expect(a).toBe(b);
  });

  it("ignores generatedAt — same content with different timestamp produces the same fingerprint", () => {
    const earlier: ProfileSnapshot = {
      ...baselineSnapshot,
      generatedAt: "2026-05-01T08:00:00.000Z",
    };
    const later: ProfileSnapshot = {
      ...baselineSnapshot,
      generatedAt: "2026-05-01T08:00:05.000Z",
    };

    expect(fingerprintSnapshot("profile-1", earlier)).toBe(
      fingerprintSnapshot("profile-1", later)
    );
  });

  it("differs when FTP changes", () => {
    const before: ProfileSnapshot = baselineSnapshot;
    const after: ProfileSnapshot = {
      ...baselineSnapshot,
      thresholds: {
        ...baselineSnapshot.thresholds,
        cycling: { ftp: 290 },
      },
    };

    expect(fingerprintSnapshot("profile-1", before)).not.toBe(
      fingerprintSnapshot("profile-1", after)
    );
  });

  it("differs when profileId changes — guards against cross-profile collision", () => {
    expect(fingerprintSnapshot("profile-1", baselineSnapshot)).not.toBe(
      fingerprintSnapshot("profile-2", baselineSnapshot)
    );
  });
});
