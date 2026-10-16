import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import HealthActivityPage from "./HealthActivityPage";

const MANUAL_STEPS = 12000;

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    name: "Athlete",
    linkedAccounts: [],
    sportZones: {},
  }),
}));
vi.mock("../../../hooks/health/use-health-daily-today-live", () => ({
  useHealthDailyTodayLive: () => ({
    id: "d1",
    profileId: "p1",
    date: "2026-06-21",
    sourceBridgeId: "manual",
    krd: { kind: "daily", version: "2.0", date: "2026-06-21", steps: 12000 },
  }),
}));

describe("HealthActivityPage", () => {
  it("should show the manual steps and no calories for a manual-only day", () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    renderWithProviders(<HealthActivityPage />, { persistence });

    // Assert
    const section = screen.getByTestId("health-activity");
    expect(section).toHaveTextContent(String(MANUAL_STEPS));
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("0")).toBeNull();
  });
});
