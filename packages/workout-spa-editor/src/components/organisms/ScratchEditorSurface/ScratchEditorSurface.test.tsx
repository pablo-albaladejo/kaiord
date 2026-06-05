import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import type { Profile } from "../../../types/profile";
import type { UserPreferences } from "../../../types/user-preferences";
import { ToastProvider } from "../../atoms/Toast";
import { ScratchEditorSurface } from "./ScratchEditorSurface";

const PROFILE_ID = "p1";
const NOW = "2026-05-22T10:00:00.000Z";
const NEGATIVE_ASSERT_DELAY_MS = 50;

async function seedActiveProfile(): Promise<void> {
  const profile: Profile = {
    id: PROFILE_ID,
    name: "Athlete",
    ftpW: 250,
    thresholdHr: 170,
    linkedAccounts: [],
  };
  await db.table<Profile>("profiles").put(profile);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
}

async function seedLastScratchSport(
  sport: UserPreferences["lastScratchSport"]
): Promise<void> {
  const row: UserPreferences = {
    profileId: PROFILE_ID,
    calendarView: "grid",
    lastScratchSport: sport,
    updatedAt: NOW,
  };
  await db.table<UserPreferences>("userPreferences").put(row);
}

function renderSurface(date: string | null = null) {
  const loc = memoryLocation({
    path: "/workout/new?source=scratch",
    record: true,
  });
  const utils = render(
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <GarminBridgeProvider>
        <ToastProvider>
          <ToastContextProvider>
            <Router hook={loc.hook}>
              <ScratchEditorSurface date={date} />
            </Router>
          </ToastContextProvider>
        </ToastProvider>
      </GarminBridgeProvider>
    </PersistenceProvider>
  );
  return { ...utils, location: loc };
}

describe("ScratchEditorSurface", () => {
  beforeEach(async () => {
    await db.table("workouts").clear();
    await db.table("userPreferences").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  afterEach(async () => {
    await db.table("userPreferences").clear();
    await db.table("profiles").clear();
    await db.table("meta").clear();
  });

  it("should seed an empty cycling workout when currentWorkout is null", async () => {
    // Arrange

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      const state = useWorkoutStore.getState();
      expect(state.currentWorkout?.extensions?.structured_workout?.sport).toBe(
        "cycling"
      );
    });
  });

  it("should render the AI banner closed and the metadata editor open", async () => {
    // Arrange

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /generate with ai/i })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      await screen.findByRole("form", { name: /edit workout metadata/i })
    ).toBeInTheDocument();
  });

  it("should NOT overwrite a pre-populated currentWorkout (library template path)", async () => {
    // Arrange

    const seeded = {
      version: "1.0",
      type: "structured_workout" as const,
      metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: {
          name: "Template Run",
          sport: "running" as const,
          steps: [],
        },
      },
    };
    useWorkoutStore.getState().loadWorkout(seeded);

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    const after = useWorkoutStore.getState();
    expect(after.currentWorkout?.extensions?.structured_workout?.name).toBe(
      "Template Run"
    );
    expect(after.currentWorkout?.extensions?.structured_workout?.sport).toBe(
      "running"
    );
  });

  it("should NOT write to Dexie on mount (persistence happens on save only)", async () => {
    // Arrange

    const put = vi.spyOn(db.table("workouts"), "put");

    // Act

    renderSurface();

    // Assert

    await waitFor(() => {
      expect(useWorkoutStore.getState().currentWorkout).not.toBeNull();
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("should seed the workout with lastScratchSport from userPreferences", async () => {
    // Arrange
    await seedActiveProfile();
    await seedLastScratchSport("running");

    // Act
    renderSurface();

    // Assert
    await waitFor(() => {
      const state = useWorkoutStore.getState();
      expect(state.currentWorkout?.extensions?.structured_workout?.sport).toBe(
        "running"
      );
    });
  });

  it("should write lastScratchSport back to userPreferences when sport changes on auto-init", async () => {
    // Arrange
    await seedActiveProfile();
    await seedLastScratchSport("cycling");

    // Act
    renderSurface();
    await waitFor(() => {
      const state = useWorkoutStore.getState();
      expect(state.currentWorkout?.extensions?.structured_workout?.sport).toBe(
        "cycling"
      );
    });
    const krd = useWorkoutStore.getState().currentWorkout!;
    useWorkoutStore.getState().updateWorkout({
      ...krd,
      metadata: { ...krd.metadata, sport: "swimming" },
      extensions: {
        ...krd.extensions,
        structured_workout: {
          ...krd.extensions!.structured_workout!,
          sport: "swimming",
        },
      },
    });

    // Assert
    await waitFor(async () => {
      const row = await db
        .table<UserPreferences>("userPreferences")
        .get(PROFILE_ID);
      expect(row?.lastScratchSport).toBe("swimming");
    });
  });

  it("should NOT write lastScratchSport when workout is pre-populated (no auto-init)", async () => {
    // Arrange
    await seedActiveProfile();
    const seeded = {
      version: "1.0",
      type: "structured_workout" as const,
      metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
      extensions: {
        structured_workout: {
          name: "Template Run",
          sport: "running" as const,
          steps: [],
        },
      },
    };
    useWorkoutStore.getState().loadWorkout(seeded);

    // Act
    renderSurface();
    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    const krd = useWorkoutStore.getState().currentWorkout!;
    useWorkoutStore.getState().updateWorkout({
      ...krd,
      metadata: { ...krd.metadata, sport: "swimming" },
      extensions: {
        ...krd.extensions,
        structured_workout: {
          ...krd.extensions!.structured_workout!,
          sport: "swimming",
        },
      },
    });

    // Assert
    await new Promise((resolve) =>
      setTimeout(resolve, NEGATIVE_ASSERT_DELAY_MS)
    );
    const row = await db
      .table<UserPreferences>("userPreferences")
      .get(PROFILE_ID);
    expect(row?.lastScratchSport).toBeUndefined();
  });

  it("should render a Save & schedule control when a date is present", async () => {
    // Arrange

    // Act
    renderSurface("2026-06-01");

    // Assert
    expect(
      await screen.findByTestId("scratch-schedule-button")
    ).toBeInTheDocument();
  });

  it("should NOT render the schedule control without a date", async () => {
    // Arrange

    // Act
    renderSurface(null);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("ai-banner")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("scratch-schedule-button")).toBeNull();
  });

  it("should disable the schedule control when no profile is active", async () => {
    // Arrange

    // Act
    renderSurface("2026-06-01");

    // Assert
    expect(await screen.findByTestId("scratch-schedule-button")).toBeDisabled();
  });

  it("should persist on the route date and navigate to /workout/:id when scheduled", async () => {
    // Arrange
    const user = userEvent.setup();
    await seedActiveProfile();
    const put = vi.spyOn(db.table("workouts"), "put");

    // Act
    const { location } = renderSurface("2026-06-01");
    const button = await screen.findByTestId("scratch-schedule-button");
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    // Assert
    await waitFor(() => {
      expect(put).toHaveBeenCalledWith(
        expect.objectContaining({ date: "2026-06-01", source: "scratch" })
      );
    });
    await waitFor(() => {
      expect(location.history.at(-1)).toMatch(/^\/workout\/[0-9a-f-]+$/);
    });
  });

  it("should reject a calendar-impossible date and not persist or navigate", async () => {
    // Arrange
    const user = userEvent.setup();
    await seedActiveProfile();
    const put = vi.spyOn(db.table("workouts"), "put");

    // Act
    const { location } = renderSurface("2026-02-31");
    const button = await screen.findByTestId("scratch-schedule-button");
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    // Assert
    await new Promise((resolve) =>
      setTimeout(resolve, NEGATIVE_ASSERT_DELAY_MS)
    );
    expect(put).not.toHaveBeenCalled();
    expect(location.history.at(-1)).toBe("/workout/new?source=scratch");
  });
});
