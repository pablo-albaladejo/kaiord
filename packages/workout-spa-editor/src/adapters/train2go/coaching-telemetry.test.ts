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

describe("emitSyncResult", () => {
  it("should emit coaching.sync.success with profileId, counts, duration on ok", () => {
    // Arrange
    const a = makeAnalytics();
    emitSyncResult(
      a,
      "train2go",
      "p1",
      { ok: true, activityCount: 5, orphansDeleted: 1 },
      120
    );
    expect(a.event).toHaveBeenCalledWith("coaching.sync.success", {
      source: "train2go",
      profileId: "p1",
      activityCount: 5,
      orphansDeleted: 1,
      durationMs: 120,
    });

    // Act
    assertNoPII(a);

    // Assert
  });

  it("should emit coaching.sync.failure with normalized errorKind", () => {
    // Arrange
    const a = makeAnalytics();
    emitSyncResult(
      a,
      "train2go",
      "p1",
      { ok: false, reason: "session-expired" },
      99
    );
    expect(a.event).toHaveBeenCalledWith("coaching.sync.failure", {
      source: "train2go",
      profileId: "p1",
      errorKind: "session-expired",
      isAutoSync: false,
    });

    // Act
    assertNoPII(a);

    // Assert
  });
});

describe("emitLinkResult", () => {
  it("should emit coaching.link.success with profileId on ok", () => {
    // Arrange
    const a = makeAnalytics();
    emitLinkResult(a, "train2go", "p1", { ok: true });
    expect(a.event).toHaveBeenCalledWith("coaching.link.success", {
      source: "train2go",
      profileId: "p1",
    });

    // Act
    assertNoPII(a);

    // Assert
  });

  it("should emit coaching.link.abort on aborted with normalized reason", () => {
    // Arrange
    const a = makeAnalytics();
    emitLinkResult(a, "train2go", "p1", { ok: false, reason: "aborted" });
    expect(a.event).toHaveBeenCalledWith("coaching.link.abort", {
      source: "train2go",
      profileId: "p1",
      reason: "user-cancelled",
    });

    // Act
    assertNoPII(a);

    // Assert
  });

  it("should emit coaching.link.failure with normalized errorKind", () => {
    // Arrange
    const a = makeAnalytics();
    const reasons = [
      "profile-deleted",
      "session-not-active",
      "transport-error",
    ] as const;
    for (const reason of reasons) {
      emitLinkResult(a, "train2go", "p1", { ok: false, reason });
    }
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

    // Act
    assertNoPII(a);

    // Assert
  });
});
