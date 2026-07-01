import { describe, expect, it } from "vitest";

import {
  baselineSnapshot,
  negativeSnapshotFixtures,
  positiveSnapshotFixtures,
} from "../test-utils/profile-snapshot-fixtures";
import { PROFILE_SAMPLE_LTHR_RUNNING } from "../test-utils/tolerance-constants";
import {
  fingerprintSnapshot,
  type ProfileSnapshot,
  profileSnapshotSchema,
} from "./profile-snapshot";

describe("profileSnapshotSchema — positive fixtures", () => {
  it.each(positiveSnapshotFixtures)("should accept %#", (fixture) => {
    // Arrange

    // Act
    const result = profileSnapshotSchema.safeParse(fixture);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(fixture);
    }
  });

  it("should accept a partial-zone payload (running.lthr only)", () => {
    // Arrange
    const partial: ProfileSnapshot = {
      schemaVersion: 1,
      profile: { name: "Partial" },
      activeSport: "running",
      thresholds: { running: { lthr: 170 } },
      heartRate: { max: 195 },
      generatedAt: "2026-05-01T00:00:00.000Z",
    };

    // Act
    const result = profileSnapshotSchema.safeParse(partial);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        result.data.thresholds?.running?.thresholdPaceSecPerKm
      ).toBeUndefined();
      expect(result.data.thresholds?.running?.lthr).toBe(
        PROFILE_SAMPLE_LTHR_RUNNING
      );
      expect(result.data.heartRate?.lthr).toBeUndefined();
    }
  });
});

describe("profileSnapshotSchema — negative fixtures", () => {
  it.each(negativeSnapshotFixtures)(
    "should reject $name",
    ({ value, expectedError }) => {
      // Arrange

      // Act
      const result = profileSnapshotSchema.safeParse(value);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        const formatted = JSON.stringify(result.error.issues);
        expect(formatted).toMatch(expectedError);
      }
    }
  );

  it("should not mutate Object.prototype when rejecting a poisoned payload", () => {
    // Arrange
    const polluted = JSON.parse(
      `{"__proto__":{"isAdmin":true},"schemaVersion":1,"profile":{"name":"P"},"generatedAt":"2026-05-01T00:00:00.000Z"}`
    ) as unknown;

    // Act
    profileSnapshotSchema.safeParse(polluted);

    // Assert
    expect(
      (Object.prototype as Record<string, unknown>).isAdmin
    ).toBeUndefined();
  });

  it("should reject payloads with circular references", () => {
    // Arrange
    const circular: Record<string, unknown> = {
      schemaVersion: 1,
      profile: { name: "x" },
      generatedAt: "2026-05-01T00:00:00.000Z",
    };
    circular.self = circular;

    // Act
    const result = profileSnapshotSchema.safeParse(circular);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toMatch(
        /invalid snapshot payload/i
      );
    }
  });
});

describe("fingerprintSnapshot", () => {
  it("should return 8-character lowercase hex", () => {
    // Arrange

    // Act
    const fp = fingerprintSnapshot("profile-1", baselineSnapshot);

    // Assert
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
  });

  it("should be deterministic across calls", () => {
    // Arrange
    const a = fingerprintSnapshot("profile-1", baselineSnapshot);

    // Act
    const b = fingerprintSnapshot("profile-1", baselineSnapshot);

    // Assert
    expect(a).toBe(b);
  });

  it("should ignore generatedAt — same content with different timestamp produces the same fingerprint", () => {
    // Arrange
    const earlier: ProfileSnapshot = {
      ...baselineSnapshot,
      generatedAt: "2026-05-01T08:00:00.000Z",
    };

    // Act
    const later: ProfileSnapshot = {
      ...baselineSnapshot,
      generatedAt: "2026-05-01T08:00:05.000Z",
    };

    // Assert
    expect(fingerprintSnapshot("profile-1", earlier)).toBe(
      fingerprintSnapshot("profile-1", later)
    );
  });

  it("should differ when FTP changes", () => {
    // Arrange
    const before: ProfileSnapshot = baselineSnapshot;

    // Act
    const after: ProfileSnapshot = {
      ...baselineSnapshot,
      thresholds: {
        ...baselineSnapshot.thresholds,
        cycling: { ftp: 290 },
      },
    };

    // Assert
    expect(fingerprintSnapshot("profile-1", before)).not.toBe(
      fingerprintSnapshot("profile-1", after)
    );
  });

  it("should differ when profileId changes — guards against cross-profile collision", () => {
    // Arrange

    // Act
    const fp1 = fingerprintSnapshot("profile-1", baselineSnapshot);
    const fp2 = fingerprintSnapshot("profile-2", baselineSnapshot);

    // Assert
    expect(fp1).not.toBe(fp2);
  });
});
