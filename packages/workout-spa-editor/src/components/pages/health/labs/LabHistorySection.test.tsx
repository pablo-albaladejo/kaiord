import "fake-indexeddb/auto";

import type { LabReport, LabValue } from "@kaiord/core";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../../adapters/dexie/dexie-persistence-adapter";
import { PersistenceProvider } from "../../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../../contexts/ToastContext";
import { LabHistorySection } from "./LabHistorySection";

vi.mock("../../../charts/uplot-base/uplot-chart", () => ({
  UplotChart: () => <div data-testid="uplot-chart-mock" />,
}));

const PROFILE_ID = "p1";

const wrap = ({ children }: { children: ReactNode }) => (
  <ToastContextProvider>
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      {children}
    </PersistenceProvider>
  </ToastContextProvider>
);

const report = (id: string, date: string, labName: string): LabReport => ({
  id,
  profileId: PROFILE_ID,
  date,
  labName,
  provenance: { source: "manual" },
});

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
  flag: "unknown",
  provenance: { source: "manual" },
  ...overrides,
});

const clearAll = () =>
  Promise.all([db.table("labReports").clear(), db.table("labValues").clear()]);

const seed = () =>
  Promise.all([
    db
      .table("labReports")
      .bulkPut([
        report("r1", "2026-01-01", "Old Lab"),
        report("r2", "2026-03-01", "New Lab"),
      ]),
    db.table("labValues").bulkPut([
      value({
        id: "v1",
        reportId: "r1",
        parameterKey: "glucose",
        date: "2026-01-01",
        valueCanonical: 90,
        flag: "in",
      }),
      value({
        id: "v2",
        reportId: "r2",
        parameterKey: "glucose",
        date: "2026-03-01",
        valueCanonical: 95,
        flag: "in",
      }),
      value({
        id: "v3",
        reportId: "r1",
        parameterKey: "ferritin",
        date: "2026-01-01",
        valueCanonical: 300,
        flag: "high",
      }),
      value({
        id: "v4",
        reportId: "r2",
        parameterKey: "creatinine",
        date: "2026-03-01",
        valueCanonical: 1.4,
        flag: "high",
      }),
    ]),
  ]);

describe("LabHistorySection", () => {
  beforeEach(async () => {
    await clearAll();
    await seed();
  });
  afterEach(clearAll);

  it("should list the latest value per parameter including an old-report-only one", async () => {
    // Arrange
    render(<LabHistorySection profileId={PROFILE_ID} />, { wrapper: wrap });

    // Act
    const items = await screen.findAllByTestId("lab-parameter-item");

    // Assert
    const keys = items.map((el) => el.getAttribute("data-parameter-key"));
    expect(keys).toEqual(
      expect.arrayContaining(["glucose", "ferritin", "creatinine"])
    );
    expect(screen.getAllByTestId("sparkline").length).toBeGreaterThan(0);
  });

  it("should open a past report's review with its parameters (DoD-3)", async () => {
    // Arrange
    render(<LabHistorySection profileId={PROFILE_ID} />, { wrapper: wrap });
    const user = userEvent.setup();
    await screen.findByTestId("lab-reports-list");

    // Act
    await user.click(screen.getByText("2026-01-01"));

    // Assert
    const review = await screen.findByTestId("lab-report-review");
    expect(review).toHaveAttribute("data-report-id", "r1");
    expect(within(review).getAllByTestId("lab-review-value").length).toBe(2);
  });

  it("should delete a report and its values reactively (F3.4)", async () => {
    // Arrange
    render(<LabHistorySection profileId={PROFILE_ID} />, { wrapper: wrap });
    const user = userEvent.setup();
    const rows = await screen.findAllByTestId("lab-report-row");
    expect(rows).toHaveLength(2);
    const newRow = screen.getByText("2026-03-01").closest("li") as HTMLElement;

    // Act
    await user.click(
      within(newRow).getByRole("button", { name: /Delete report/ })
    );
    await user.click(within(newRow).getByRole("button", { name: "Confirm" }));

    // Assert
    await waitFor(() =>
      expect(screen.getAllByTestId("lab-report-row")).toHaveLength(1)
    );
    const remaining = await db.table<LabValue>("labValues").toArray();
    expect(remaining.every((v) => v.reportId === "r1")).toBe(true);
  });
});
