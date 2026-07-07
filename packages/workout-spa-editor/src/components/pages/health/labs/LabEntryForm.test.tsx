/**
 * Component test for the DoD-1 entry form: adding parameters, the live
 * conversion preview, and saving through `saveLabReport` with the correct
 * canonical shape. `useActiveProfileLive` is mocked (per the established
 * pattern in `HealthDashboardPage.test.tsx`) since it reads the real Dexie
 * singleton rather than the injected persistence port. Rendered through
 * `renderWithProviders` (per `WellnessEntryForm.test.tsx`) so toasts are
 * actually mounted (`AppToastProvider` alone is not enough — it needs the
 * `ToastRenderer` that `renderWithProviders` wires in).
 */
import { describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../../../ports/persistence-port";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../../test-utils";
import { createInMemoryPersistence } from "../../../../test-utils/in-memory-persistence";
import { LabEntryForm } from "./LabEntryForm";

vi.mock("../../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({
    id: "p1",
    profile: { id: "p1", name: "Athlete", sex: "female", linkedAccounts: [] },
  }),
}));

const renderForm = (
  persistence: PersistencePort = createInMemoryPersistence()
) => {
  renderWithProviders(<LabEntryForm />, { persistence });
  return persistence;
};

describe("LabEntryForm", () => {
  it("should add and remove parameter rows", async () => {
    // Arrange
    const user = userEvent.setup();
    renderForm();

    // Act
    await user.click(screen.getByRole("button", { name: "Add parameter" }));

    // Assert
    expect(screen.getAllByTestId("lab-parameter-row")).toHaveLength(2);
    await user.click(
      screen.getAllByRole("button", { name: "Remove parameter" })[0]
    );
    expect(screen.getAllByTestId("lab-parameter-row")).toHaveLength(1);
  });

  it("should show a live conversion preview for a known non-canonical unit", async () => {
    // Arrange
    const user = userEvent.setup();
    renderForm();

    // Act
    await user.type(
      screen.getByLabelText("Parameter"),
      "Vitamin D (25-OH) (25-OH-D)"
    );
    await user.type(screen.getByLabelText("Value"), "60");
    await user.clear(screen.getByLabelText("Unit"));
    await user.type(screen.getByLabelText("Unit"), "nmol/L");

    // Assert
    await waitFor(() => {
      expect(screen.getByText("≈ 24.00 ng/mL")).toBeInTheDocument();
    });
  });

  it("should save the report with canonical values and flags via saveLabReport", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = renderForm();

    // Act
    await user.type(screen.getByLabelText("Date"), "2026-03-05");
    await user.type(
      screen.getByLabelText("Parameter"),
      "Glucose (fasting) (GLU)"
    );
    await user.type(screen.getByLabelText("Value"), "110");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    await waitFor(async () => {
      const reports = await persistence.labs.listReports("p1");
      expect(reports).toHaveLength(1);
    });
    const reports = await persistence.labs.listReports("p1");
    const values = await persistence.labs.getValuesByReport(
      "p1",
      reports[0].id
    );
    expect(values).toEqual([
      expect.objectContaining({
        parameterKey: "glucose",
        valueCanonical: 110,
        unitCanonical: "mg/dL",
        refSource: "catalog",
        flag: "high",
        provenance: { source: "manual" },
      }),
    ]);
  });

  it("should not save when every row is blank", async () => {
    // Arrange
    const user = userEvent.setup();
    const persistence = renderForm();

    // Act
    await user.type(screen.getByLabelText("Date"), "2026-03-05");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText("Add at least one parameter value before saving")
      ).toBeInTheDocument();
    });
    expect(await persistence.labs.listReports("p1")).toHaveLength(0);
  });
});
