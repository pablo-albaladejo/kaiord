/**
 * `useSyncCallback` hands a sync's coach moves to the coach-move notice —
 * the one path both the manual and the automatic week sync take.
 */
import type { Analytics } from "@kaiord/core";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import {
  CoachMoveNoticeProvider,
  useCoachMoveNotice,
} from "../../contexts/coach-move-notice-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";

const WEEK = "2026-10-05";
const mockSyncWeek = vi.fn();
vi.mock("../../application/coaching/sync-week", () => ({
  syncWeek: (...args: unknown[]) => mockSyncWeek(...args),
}));

import { useSyncCallback } from "./use-train2go-actions";

const transport = { source: "train2go" } as CoachingTransport;
const analytics = { event: vi.fn() } as unknown as Analytics;

const wrapper = ({ children }: { children: ReactNode }) => (
  <CoachMoveNoticeProvider>{children}</CoachMoveNoticeProvider>
);
const renderSync = () =>
  renderHook(
    () => ({
      sync: useSyncCallback(createInMemoryPersistence(), transport, analytics),
      notice: useCoachMoveNotice("p1", WEEK),
    }),
    { wrapper }
  );

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
    const { result } = renderSync();

    // Act
    await act(() => result.current.sync("p1", WEEK));

    // Assert
    expect(result.current.notice).toMatchObject({
      coachMoves: 1,
      overriddenLocalMoves: 1,
    });
  });

  it("should report nothing for a failed sync", async () => {
    // Arrange
    mockSyncWeek.mockResolvedValue({ ok: false, reason: "not-linked" });
    const { result } = renderSync();

    // Act
    await act(() => result.current.sync("p1", WEEK));

    // Assert
    expect(result.current.notice).toBeUndefined();
  });
});
