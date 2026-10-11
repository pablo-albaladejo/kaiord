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
const SEVEN_THIRTY = 27000;
const SCORE = 81;

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
    await fillAndSave(user, { "HRV (ms)": "-5" });

    // Assert
    expect(
      await screen.findByText("Could not save — please retry")
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    const hrv = await persistence.healthHrv.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(hrv).toHaveLength(0);
  });

  it("should treat a partial save as failure and keep the dialog open", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { "Weight (kg)": "72", "HRV (ms)": "-5" });

    // Assert
    expect(
      await screen.findByText("Could not save — please retry")
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    const hrv = await persistence.healthHrv.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(hrv).toHaveLength(0);
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

  it("should ask for the hours slept next to the sleep score", async () => {
    // Arrange
    const persistence = await setup();

    // Act
    renderForm(persistence);

    // Assert
    expect(screen.getByLabelText("Sleep hours (h:mm)")).toBeInTheDocument();
    expect(screen.getByLabelText("Bedtime")).toBeInTheDocument();
    expect(screen.getByLabelText("Wake time")).toBeInTheDocument();
  });

  it("should save 7:30 and a score as a 7 h 30 min night with that score", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, {
      "Sleep hours (h:mm)": "7:30",
      "Sleep score": "81",
    });

    // Assert
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [row] = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(row?.krd.totalDurationSeconds).toBe(SEVEN_THIRTY);
    expect(row?.krd.score).toBe(SCORE);
  });

  it("should save a score alone without a zero-hour night", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { "Sleep score": "81" });

    // Assert
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [row] = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(row?.krd.score).toBe(SCORE);
    expect(row?.krd).not.toHaveProperty("totalDurationSeconds");
  });

  it("should derive the night from bedtime and wake time", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { Bedtime: "23:00", "Wake time": "06:30" });

    // Assert
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [row] = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(row?.krd.totalDurationSeconds).toBe(SEVEN_THIRTY);
    expect(row?.krd.endTime).toBe(new Date(`${DAY}T06:30:00`).toISOString());
  });

  it("should explain malformed hours and write nothing", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, { "Sleep hours (h:mm)": "7h30" });

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter the hours slept as h:mm, for example 7:30."
    );
    expect(onSaved).not.toHaveBeenCalled();
    const rows = await persistence.healthSleep.getByProfileAndDateRange(
      PROFILE_ID,
      DAY,
      DAY
    );
    expect(rows).toHaveLength(0);
  });

  it("should refuse hours that disagree with bedtime and wake time", async () => {
    // Arrange
    const persistence = await setup();
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm(persistence, onSaved);

    // Act
    await fillAndSave(user, {
      "Sleep hours (h:mm)": "8:00",
      Bedtime: "23:00",
      "Wake time": "06:30",
    });

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The hours slept don't match the bedtime and wake time."
    );
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each(["150", "81.5", "-1"])(
    "should explain a sleep score of %s and write nothing",
    async (score) => {
      // Arrange
      const persistence = await setup();
      const user = userEvent.setup();
      const onSaved = vi.fn();
      renderForm(persistence, onSaved);

      // Act
      await fillAndSave(user, { "Sleep score": score });

      // Assert
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Enter a sleep score from 0 to 100."
      );
      expect(onSaved).not.toHaveBeenCalled();
      const rows = await persistence.healthSleep.getByProfileAndDateRange(
        PROFILE_ID,
        DAY,
        DAY
      );
      expect(rows).toHaveLength(0);
    }
  );
});
