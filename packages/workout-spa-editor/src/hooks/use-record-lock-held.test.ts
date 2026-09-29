import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRecordLockHeld } from "./use-record-lock-held";

const NAME = "garmin-place:record-1";
/** Two held answers, then the release. */
const QUERIES_UNTIL_RELEASE = 3;

const stubLocks = (answers: string[][]) => {
  const query = vi.fn();
  for (const names of answers)
    query.mockResolvedValueOnce({ held: names.map((name) => ({ name })) });
  query.mockResolvedValue({ held: [] });
  vi.stubGlobal("navigator", { ...navigator, locks: { query } });
  return query;
};

describe("useRecordLockHeld", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should answer false when nothing is watched", () => {
    // Arrange
    const name = undefined;

    // Act
    const { result } = renderHook(() => useRecordLockHeld(name));

    // Assert
    expect(result.current).toBe(false);
  });

  it("should answer false without Web Locks", () => {
    // Arrange
    vi.stubGlobal("navigator", { ...navigator, locks: undefined });

    // Act
    const { result } = renderHook(() => useRecordLockHeld(NAME));

    // Assert
    expect(result.current).toBe(false);
  });

  it("should stay held until the lock is released", async () => {
    // Arrange
    const query = stubLocks([[NAME], [NAME]]);

    // Act
    const { result } = renderHook(() => useRecordLockHeld(NAME));

    // Assert
    expect(result.current).toBe(true);
    await waitFor(() => expect(result.current).toBe(false), {
      timeout: 5_000,
    });
    expect(query.mock.calls.length).toBeGreaterThanOrEqual(
      QUERIES_UNTIL_RELEASE
    );
  });

  it("should ignore another record's lock", async () => {
    // Arrange
    stubLocks([["garmin-place:record-2"]]);

    // Act
    const { result } = renderHook(() => useRecordLockHeld(NAME));

    // Assert
    await waitFor(() => expect(result.current).toBe(false));
  });
});
