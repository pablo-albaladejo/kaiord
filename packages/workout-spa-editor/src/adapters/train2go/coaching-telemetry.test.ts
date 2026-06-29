/**
 * Tests for the coaching telemetry helpers. Asserts payload shape and
 * branch coverage for sync/link result mapping. PII fields (externalUserId,
 * externalUserName, sourceId, description) MUST never appear.
 */

import type { Analytics } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { emitLinkResult, emitSyncResult } from "./coaching-telemetry";

const makeAnalytics = (): Analytics => ({
  pageView: vi.fn(),
  event: vi.fn(),
});

const PII = ["externalUserId", "externalUserName", "sourceId", "description"];

const assertNoPII = (analytics: Analytics) => {
  const events = (analytics.event as ReturnType<typeof vi.fn>).mock.calls;
  for (const [, payload] of events) {
    for (const field of PII) {
      expect(Object.keys(payload ?? {})).not.toContain(field);
    }
  }
};

const SUCCESS_DURATION_MS = 120;
const FAILURE_DURATION_MS = 99;

describe("emitSyncResult", () => {
  it("should emit coaching.sync.success with profileId, counts, duration on ok", () => {
    // Arrange
    const a = makeAnalytics();

    // Act
    emitSyncResult(
      a,
      "train2go",
      "p1",
      { ok: true, activityCount: 5, orphansDeleted: 1 },
      SUCCESS_DURATION_MS
    );

    // Assert
    expect(a.event).toHaveBeenCalledWith("coaching.sync.success", {
      source: "train2go",
      profileId: "p1",
      activityCount: 5,
      orphansDeleted: 1,
      durationMs: SUCCESS_DURATION_MS,
    });
    assertNoPII(a);
  });

  it("should emit coaching.sync.failure with normalized errorKind", () => {
    // Arrange
    const a = makeAnalytics();

    // Act
    emitSyncResult(
      a,
      "train2go",
      "p1",
      { ok: false, reason: "session-expired" },
      FAILURE_DURATION_MS
    );

    // Assert
    expect(a.event).toHaveBeenCalledWith("coaching.sync.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "session-expired",
      isAutoSync: false,
    });
    assertNoPII(a);
  });
});

describe("emitLinkResult", () => {
  it("should emit coaching.link.success with profileId on ok", () => {
    // Arrange
    const a = makeAnalytics();

    // Act
    emitLinkResult(a, "train2go", "p1", { ok: true });

    // Assert
    expect(a.event).toHaveBeenCalledWith("coaching.link.success", {
      source: "train2go",
      profileId: "p1",
    });
    assertNoPII(a);
  });

  it("should emit coaching.link.abort on aborted with normalized reason", () => {
    // Arrange
    const a = makeAnalytics();

    // Act
    emitLinkResult(a, "train2go", "p1", { ok: false, reason: "aborted" });

    // Assert
    expect(a.event).toHaveBeenCalledWith("coaching.link.abort", {
      source: "train2go",
      profileId: "p1",
      reason: "user-cancelled",
    });
    assertNoPII(a);
  });

  it("should emit coaching.link.failure with normalized errorKind", () => {
    // Arrange
    const a = makeAnalytics();
    const reasons = [
      "profile-deleted",
      "session-not-active",
      "transport-error",
    ] as const;

    // Act
    for (const reason of reasons) {
      emitLinkResult(a, "train2go", "p1", { ok: false, reason });
    }

    // Assert
    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "profile-deleted",
    });
    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "session-not-active",
    });
    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "transport-error",
    });
    assertNoPII(a);
  });
});
