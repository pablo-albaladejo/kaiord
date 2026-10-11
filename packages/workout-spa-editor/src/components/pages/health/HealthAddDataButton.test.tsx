import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import HealthActivityPage from "./HealthActivityPage";
import HealthRecoveryPage from "./HealthRecoveryPage";
import HealthSleepPage from "./HealthSleepPage";
import HealthWeightPage from "./HealthWeightPage";

vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    name: "Athlete",
    linkedAccounts: [],
    sportZones: {},
  }),
}));
vi.mock("../../../hooks/health/use-health-sleep-week-live", () => ({
  useHealthSleepWeekLive: () => [],
}));
vi.mock("../../../hooks/health/use-health-weight-history-live", () => ({
  useHealthWeightHistoryLive: () => [],
}));
vi.mock(
  "../../../hooks/health/use-health-body-composition-latest-live",
  () => ({
    useHealthBodyCompositionLatestLive: () => undefined,
  })
);
vi.mock("../../../hooks/health/use-health-hrv-history-live", () => ({
  useHealthHrvHistoryLive: () => [],
}));
vi.mock("../../../hooks/health/use-health-stress-day-live", () => ({
  useHealthStressDayLive: () => [],
}));
vi.mock("../../../hooks/health/use-health-daily-today-live", () => ({
  useHealthDailyTodayLive: () => undefined,
}));

const PAGES: { name: string; Page: ComponentType; field: string }[] = [
  { name: "sleep", Page: HealthSleepPage, field: "Sleep hours (h:mm)" },
  { name: "weight", Page: HealthWeightPage, field: "Weight (kg)" },
  { name: "recovery", Page: HealthRecoveryPage, field: "HRV (ms)" },
  { name: "activity", Page: HealthActivityPage, field: "Steps" },
];

describe("Health pages add-data action", () => {
  it.each(PAGES)(
    "should open manual entry on the $name page's own metric",
    async ({ Page, field }) => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<Page />, {
        persistence: createInMemoryPersistence(),
      });

      // Act
      await user.click(screen.getByRole("button", { name: "Add data" }));

      // Assert
      expect(await screen.findByTestId("wellness-entry-dialog")).toBeVisible();
      expect(screen.getByLabelText(field)).toHaveFocus();
    }
  );
});
