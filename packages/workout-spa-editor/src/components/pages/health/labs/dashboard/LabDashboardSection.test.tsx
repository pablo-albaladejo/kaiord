import "fake-indexeddb/auto";

import type { LabValue } from "@kaiord/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../../../contexts/persistence-context";
import { LabDashboardSection } from "./LabDashboardSection";

vi.mock("../../../../charts/uplot-base/uplot-chart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const PROFILE_ID = "p1";
const NOW = "2026-07-07T12:00:00.000Z";
// Pinning parameters chains Dexie writes → live-query re-renders → per-card
// live queries; under CI CPU contention this can outrun a short waitFor, so
// use the repo's Dexie-slow budget (matches playwright/expect 10s).
const CHART_RENDER_TIMEOUT_MS = 10_000;

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider persistence={createDexiePersistence(db)}>
    {children}
  </PersistenceProvider>
);

const value = (
  overrides: Partial<LabValue> &
    Pick<LabValue, "id" | "reportId" | "parameterKey" | "date">
): LabValue => ({
  profileId: PROFILE_ID,
  valueRaw: 1,
  unitRaw: "mg/dL",
  valueCanonical: 1,
  unitCanonical: "mg/dL",
  refSource: "none",
  flag: "in",
  provenance: { source: "manual" },
  ...overrides,
});

const clearAll = () =>
  Promise.all([
    db.table("labValues").clear(),
    db.table("userPreferences").clear(),
    db.table("profiles").clear(),
  ]);

const seed = () =>
  Promise.all([
    db.table("profiles").put({
      id: PROFILE_ID,
      name: "Athlete",
      linkedAccounts: [],
      sportZones: {},
      createdAt: NOW,
      updatedAt: NOW,
    }),
    db.table("labValues").bulkPut([
      value({
        id: "v1",
        reportId: "r1",
        parameterKey: "glucose",
        date: "2026-01-01",
        valueCanonical: 90,
      }),
      value({
        id: "v2",
        reportId: "r1",
        parameterKey: "ferritin",
        date: "2026-01-01",
        valueCanonical: 300,
        flag: "high",
      }),
    ]),
  ]);

describe("LabDashboardSection", () => {
  beforeEach(async () => {
    await clearAll();
    await seed();
  });
  afterEach(clearAll);

  it("should render no chart cards when no parameter is pinned", async () => {
    // Arrange
    render(<LabDashboardSection profileId={PROFILE_ID} />, { wrapper: wrap });

    // Act
    await screen.findAllByTestId("lab-parameter-item");

    // Assert
    expect(
      screen.getByText("Pin a parameter above to see its evolution chart.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("lab-dashboard-grid")).not.toBeInTheDocument();
  });

  it("should add a chart card when a parameter is pinned", async () => {
    // Arrange
    render(<LabDashboardSection profileId={PROFILE_ID} />, { wrapper: wrap });
    const user = userEvent.setup();
    const glucoseItem = (
      await screen.findAllByTestId("lab-parameter-item")
    ).find(
      (el) => el.getAttribute("data-parameter-key") === "glucose"
    ) as HTMLElement;

    // Act
    await user.click(within(glucoseItem).getByTestId("lab-parameter-select"));

    // Assert
    const grid = await screen.findByTestId("lab-dashboard-grid");
    expect(
      within(grid).getAllByTestId("lab-parameter-chart-card")
    ).toHaveLength(1);
    expect(
      await within(grid).findByTestId("lab-parameter-chart")
    ).toHaveAttribute("data-parameter-key", "glucose");
  });

  it("should render one chart card per pinned parameter, multiple at once", async () => {
    // Arrange
    render(<LabDashboardSection profileId={PROFILE_ID} />, { wrapper: wrap });
    const user = userEvent.setup();
    const total = (await screen.findAllByTestId("lab-parameter-item")).length;

    // Act

    // Pin each row, re-querying fresh every iteration: the list is driven by
    // `summaries` (stable order across pins), but an awaited click triggers a
    // re-render that can detach a previously-captured node, so a reused
    // reference would silently click a stale element and skip the pin.
    for (let i = 0; i < total; i += 1) {
      const rows = await screen.findAllByTestId("lab-parameter-item");
      const row = rows[i];
      if (!row) throw new Error(`lab-parameter-item ${i} disappeared`);
      await user.click(within(row).getByTestId("lab-parameter-select"));
    }

    // Assert
    const grid = await screen.findByTestId("lab-dashboard-grid");
    await waitFor(
      () =>
        expect(
          within(grid).getAllByTestId("lab-parameter-chart-card")
        ).toHaveLength(total),
      { timeout: CHART_RENDER_TIMEOUT_MS }
    );
  });

  it("should remove a chart card when its parameter is unpinned", async () => {
    // Arrange
    render(<LabDashboardSection profileId={PROFILE_ID} />, { wrapper: wrap });
    const user = userEvent.setup();
    const glucoseItem = (
      await screen.findAllByTestId("lab-parameter-item")
    ).find(
      (el) => el.getAttribute("data-parameter-key") === "glucose"
    ) as HTMLElement;
    const selectButton = within(glucoseItem).getByTestId(
      "lab-parameter-select"
    );
    await user.click(selectButton);
    await screen.findByTestId("lab-dashboard-grid");

    // Act
    await user.click(selectButton);

    // Assert
    expect(
      await screen.findByText(
        "Pin a parameter above to see its evolution chart."
      )
    ).toBeInTheDocument();
  });
});
