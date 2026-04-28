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
  it("emits coaching.sync.success with counts + duration on ok", () => {
    const a = makeAnalytics();

    emitSyncResult(
      a,
      "train2go",
      { ok: true, activityCount: 5, orphansDeleted: 1 },
      120
    );

    expect(a.event).toHaveBeenCalledWith("coaching.sync.success", {
      source: "train2go",
      activityCount: 5,
      orphansDeleted: 1,
      durationMs: 120,
    });
    assertNoPII(a);
  });

  it("emits coaching.sync.failure with errorKind on failure", () => {
    const a = makeAnalytics();

    emitSyncResult(a, "train2go", { ok: false, reason: "session-expired" }, 99);

    expect(a.event).toHaveBeenCalledWith("coaching.sync.failure", {
      source: "train2go",
      errorKind: "session-expired",
      isAutoSync: false,
    });
    assertNoPII(a);
  });
});

describe("emitLinkResult", () => {
  it("emits coaching.link.success on ok", () => {
    const a = makeAnalytics();

    emitLinkResult(a, "train2go", { ok: true });

    expect(a.event).toHaveBeenCalledWith("coaching.link.success", {
      source: "train2go",
    });
    assertNoPII(a);
  });

  it("emits coaching.link.abort on aborted", () => {
    const a = makeAnalytics();

    emitLinkResult(a, "train2go", { ok: false, reason: "aborted" });

    expect(a.event).toHaveBeenCalledWith("coaching.link.abort", {
      source: "train2go",
      reason: "user-cancelled",
    });
    assertNoPII(a);
  });

  it("emits coaching.link.failure with errorKind on profile-deleted / session-not-active / transport-error", () => {
    const a = makeAnalytics();
    const reasons = [
      "profile-deleted",
      "session-not-active",
      "transport-error",
    ] as const;

    for (const reason of reasons) {
      emitLinkResult(a, "train2go", { ok: false, reason });
    }

    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      errorKind: "profile-deleted",
    });
    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      errorKind: "session-not-active",
    });
    expect(a.event).toHaveBeenCalledWith("coaching.link.failure", {
      source: "train2go",
      errorKind: "transport-error",
    });
    assertNoPII(a);
  });
});
