/**
 * useDayEnergyBalance goal-horizon clock test.
 *
 * Regression guard: the hook MUST pass the real local day as `today` so the
 * goal horizon (months-to-target) is measured from the current date, not the
 * viewed `date`. Viewing a past/future day previously defaulted `today` to that
 * day, shrinking/growing the horizon and distorting the daily target.
 */

import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildDayEnergyBalance } from "../../application/energy/build-day-energy-balance";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { todayIsoDate } from "../../utils/today-iso-date";
import { useDayEnergyBalance } from "./use-day-energy-balance";

vi.mock("../../application/energy/build-day-energy-balance", () => ({
  buildDayEnergyBalance: vi.fn(() =>
    Promise.resolve({ gated: true, reason: "profile-incomplete" })
  ),
}));

const VIEWED_DATE = "2026-01-15";

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("useDayEnergyBalance goal-horizon clock", () => {
  it("should pass the real local today as the goal horizon, not the viewed date", async () => {
    // Arrange
    const mocked = vi.mocked(buildDayEnergyBalance);
    mocked.mockClear();

    // Act
    renderHook(() => useDayEnergyBalance("p1", VIEWED_DATE), { wrapper: wrap });

    // Assert
    await waitFor(() => expect(mocked).toHaveBeenCalled());
    expect(mocked).toHaveBeenCalledWith(
      expect.objectContaining({ date: VIEWED_DATE, today: todayIsoDate() })
    );
  });
});
