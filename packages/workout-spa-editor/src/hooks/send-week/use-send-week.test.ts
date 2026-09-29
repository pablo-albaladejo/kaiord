import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { failed } from "../../application/garmin-placement/placement-result";
import type { SendWeekContext } from "./send-week-run";

const mockRun = vi.fn();
vi.mock("./send-week-run", () => ({
  runSendWeek: (...args: unknown[]) => mockRun(...args),
}));

import { useSendWeek } from "./use-send-week";

const ctx = { features: [] } as unknown as SendWeekContext;
const WEEK = [
  { workoutId: "w-1", date: "2026-10-05" },
  { workoutId: "w-2", date: "2026-10-06" },
];
type Handlers = { onOutcome: (o: unknown) => void; isCancelled: () => boolean };

const finish = (results: Record<string, unknown>) =>
  mockRun.mockImplementationOnce(
    async (_c: unknown, items: typeof WEEK, h: Handlers) => {
      for (const i of items)
        h.onOutcome({
          ...i,
          status: (results[i.workoutId] as { kind: string }).kind,
          result: results[i.workoutId],
        });
      return { outcomes: [], cancelled: false };
    }
  );

/** A run that stays in flight until `end` and exposes its handlers. */
const holdRun = () => {
  const held = { handlers: undefined as Handlers | undefined, end: () => {} };
  mockRun.mockImplementationOnce(
    (_c: unknown, _i: unknown, h: Handlers) =>
      new Promise((resolve) => {
        held.handlers = h;
        held.end = () => resolve({ outcomes: [], cancelled: h.isCancelled() });
      })
  );
  return held;
};

describe("useSendWeek", () => {
  it("should show a blocked pre-flight", async () => {
    // Arrange
    mockRun.mockResolvedValueOnce("no-bridge");
    const { result } = renderHook(() => useSendWeek(ctx));

    // Act
    await act(() => result.current.start(WEEK));

    // Assert
    expect(result.current.state).toEqual({
      phase: "blocked",
      failure: "no-bridge",
    });
  });

  it("should retry only the retryable item and keep the others", async () => {
    // Arrange
    finish({
      "w-1": { kind: "scheduled" },
      "w-2": failed("needs-reauth", true),
    });
    const { result } = renderHook(() => useSendWeek(ctx));
    await act(() => result.current.start(WEEK));
    finish({ "w-2": { kind: "scheduled" } });

    // Act
    await act(() => result.current.retry());

    // Assert
    expect(mockRun.mock.lastCall?.[1]).toEqual([WEEK[1]]);
    expect(result.current.state).toMatchObject({
      phase: "done",
      total: WEEK.length,
      outcomes: [
        { workoutId: "w-1", status: "scheduled" },
        { workoutId: "w-2", status: "scheduled" },
      ],
    });
  });

  it("should hand the run a cancel flag that Stop raises", async () => {
    // Arrange
    let isCancelled = () => false;
    mockRun.mockImplementationOnce(
      async (_c: unknown, _i: unknown, h: Handlers) => {
        isCancelled = h.isCancelled;
        return { outcomes: [], cancelled: true };
      }
    );
    const { result } = renderHook(() => useSendWeek(ctx));
    await act(() => result.current.start(WEEK));

    // Act
    act(() => result.current.cancel());

    // Assert
    expect(isCancelled()).toBe(true);
    expect(result.current.state).toMatchObject({
      phase: "done",
      cancelled: true,
    });
  });

  it("should cancel the run and keep the panel closed when it closes", async () => {
    // Arrange
    const held = holdRun();
    const { result } = renderHook(() => useSendWeek(ctx));
    let running: Promise<void> | undefined;
    act(() => void (running = result.current.start(WEEK)));

    // Act
    act(() => result.current.close());
    await act(async () => {
      held.handlers?.onOutcome({ ...WEEK[0], status: "scheduled" });
      held.end();
      await running;
    });

    // Assert
    expect(held.handlers?.isCancelled()).toBe(true);
    expect(result.current.state).toEqual({ phase: "idle" });
  });

  it("should keep a closed run cancelled when the next run starts", () => {
    // Arrange
    const first = holdRun();
    holdRun();
    const { result } = renderHook(() => useSendWeek(ctx));
    act(() => void result.current.start(WEEK));
    act(() => result.current.close());

    // Act
    act(() => void result.current.start(WEEK));

    // Assert
    expect(first.handlers?.isCancelled()).toBe(true);
  });

  it("should cancel the run on unmount", () => {
    // Arrange
    const held = holdRun();
    const { result, unmount } = renderHook(() => useSendWeek(ctx));
    act(() => void result.current.start(WEEK));

    // Act
    unmount();

    // Assert
    expect(held.handlers?.isCancelled()).toBe(true);
  });

  it("should keep the whole week's total when retrying after Stop", async () => {
    // Arrange
    mockRun.mockImplementationOnce(
      async (_c: unknown, items: typeof WEEK, h: Handlers) => {
        h.onOutcome({
          ...items[0],
          status: "failed",
          result: failed("needs-reauth", true),
        });
        h.onOutcome({
          ...items[1],
          status: "not-eligible",
          notEligible: "stopped",
        });
        return { outcomes: [], cancelled: true };
      }
    );
    const { result } = renderHook(() => useSendWeek(ctx));
    await act(() => result.current.start(WEEK));
    finish({ "w-1": { kind: "scheduled" } });

    // Act
    await act(() => result.current.retry());

    // Assert
    expect(mockRun.mock.lastCall?.[1]).toEqual([WEEK[0]]);
    expect(result.current.state).toMatchObject({
      phase: "done",
      total: WEEK.length,
      outcomes: [
        { workoutId: "w-1", status: "scheduled" },
        { workoutId: "w-2", notEligible: "stopped" },
      ],
    });
  });
});
