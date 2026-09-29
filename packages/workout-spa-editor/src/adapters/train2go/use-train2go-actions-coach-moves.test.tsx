/**
 * `useSyncCallback` hands a sync's coach moves to the coach-move notice —
 * the one path both the manual and the automatic week sync take.
 */
import type { Analytics } from "@kaiord/core";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { useCoachMoveNoticeStore } from "../../store/coach-move-notice-store";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";

const WEEK = "2026-10-05";
const mockSyncWeek = vi.fn();
vi.mock("../../application/coaching/sync-week", () => ({
  syncWeek: (...args: unknown[]) => mockSyncWeek(...args),
}));

import { useSyncCallback } from "./use-train2go-actions";

const transport = { source: "train2go" } as CoachingTransport;
const analytics = { event: vi.fn() } as unknown as Analytics;

beforeEach(() => {
  useCoachMoveNoticeStore.setState({ notices: {}, dismissed: {} });
});

describe("useSyncCallback coach moves", () => {
  it("should report a successful sync's moves for its week", async () => {
    // Arrange
    mockSyncWeek.mockResolvedValue({
      ok: true,
      activityCount: 1,
      orphansDeleted: 0,
      coachMoves: 1,
      overriddenLocalMoves: 1,
    });
    const p = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useSyncCallback(p, transport, analytics)
    );

    // Act
    await act(() => result.current("p1", WEEK));

    // Assert
    expect(useCoachMoveNoticeStore.getState().notices["p1:2026-10-05"]).toEqual(
      { coachMoves: 1, overriddenLocalMoves: 1, seq: 1 }
    );
  });

  it("should report nothing for a failed sync", async () => {
    // Arrange
    mockSyncWeek.mockResolvedValue({ ok: false, reason: "not-linked" });
    const p = createInMemoryPersistence();
    const { result } = renderHook(() =>
      useSyncCallback(p, transport, analytics)
    );

    // Act
    await act(() => result.current("p1", WEEK));

    // Assert
    expect(useCoachMoveNoticeStore.getState().notices).toEqual({});
  });
});
