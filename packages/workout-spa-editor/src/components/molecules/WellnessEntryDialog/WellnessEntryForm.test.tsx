/**
 * WellnessEntryForm + use-save-wellness tests.
 *
 * Rendered through `renderWithProviders` (in-memory persistence +
 * AppToastProvider) with an active profile seeded so the use case can
 * resolve `getActiveId()`. Persisted rows are read back via the
 * metric's own in-memory repo (`getByProfileAndDateRange`).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PersistencePort } from "../../../ports/persistence-port";
import {
  renderWithProviders,
  screen,
  userEvent,
  waitFor,
} from "../../../test-utils";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { WellnessEntryForm } from "./WellnessEntryForm";

const DAY = "2026-05-04";
const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";

const setup = async (): Promise<PersistencePort> => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.setActiveId(PROFILE_ID);
  return persistence;
};

const renderForm = (persistence: PersistencePort, onSaved = vi.fn()) =>
  renderWithProviders(<WellnessEntryForm date={DAY} onSaved={onSaved} />, {
    persistence,
  });

const fillAndSave = async (
  user: ReturnType<typeof userEvent.setup>,
  entries: Record<string, string>
) => {
  for (const [label, value] of Object.entries(entries)) {
    await user.type(screen.getByLabelText(label), value);
  }
  await user.click(screen.getByRole("button", { name: "Save" }));
};

describe("WellnessEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render four metric fields with accessible labels", async () => {
    // Arrange
    const persistence = await setup();

    // Act
    renderForm(persistence);

    // Assert
    expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleep score")).toBeInTheDocument();
    expect(screen.getByLabelText("HRV (ms)")).toBeInTheDocument();
    expect(screen.getByLabelText("Steps")).toBeInTheDocument();
  });

  it("should persist every filled metric in a single submit", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    renderForm(persistence);

    // Act
    await fillAndSave(user, { "Weight (kg)": "72", Steps: "8000" });

    // Assert
    await waitFor(async () => {
      const weight = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      const daily = await persistence.healthDaily.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(weight).toHaveLength(1);
      expect(daily).toHaveLength(1);
    });
  });

  it("should submit only filled fields when entry is partial", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    renderForm(persistence);

    // Act
    await fillAndSave(user, { "Weight (kg)": "72" });

    // Assert
    await waitFor(async () => {
      const weight = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(weight).toHaveLength(1);
    });
    const daily = await persistence.healthDaily.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    const hrv = await persistence.healthHrv.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(daily).toHaveLength(0);
    expect(hrv).toHaveLength(0);
  });

  it("should not write when all fields are empty", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    const weight = await persistence.healthWeight.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(weight).toHaveLength(0);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("should show a static success toast on submit", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    renderForm(persistence);

    // Act
    await fillAndSave(user, { "Weight (kg)": "72" });

    // Assert
    expect(await screen.findByText("Wellness saved")).toBeInTheDocument();
  });

  it("should keep exactly one row when the submit is fired twice without awaiting", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    renderForm(persistence);
    await user.type(screen.getByLabelText("Weight (kg)"), "72");
    const save = screen.getByRole("button", { name: "Save" });

    // Act
    await user.click(save);
    await user.click(save);

    // Assert
    await waitFor(async () => {
      const weight = await persistence.healthWeight.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(weight).toHaveLength(1);
    });
  });

  it("should keep the dialog open and toast a failure when the save is rejected", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { "Sleep score": "150" });

    // Assert
    expect(
      await screen.findByText("Could not save — please retry")
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    const sleep = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(sleep).toHaveLength(0);
  });

  it("should treat a partial save as failure and keep the dialog open", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { "Weight (kg)": "72", "Sleep score": "150" });

    // Assert
    expect(
      await screen.findByText("Could not save — please retry")
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    const sleep = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(sleep).toHaveLength(0);
  });

  it("should disable the Save button while isSaving", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = persistence.profiles.getActiveId;
    persistence.profiles.getActiveId = async () => {
      await gate;
      return original();
    };
    renderForm(persistence);
    await user.type(screen.getByLabelText("Weight (kg)"), "72");

    // Act
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Assert
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });
    release?.();
  });
});
