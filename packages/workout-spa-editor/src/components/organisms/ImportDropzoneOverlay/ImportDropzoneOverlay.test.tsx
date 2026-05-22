import type { Analytics } from "@kaiord/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { AnalyticsProvider } from "../../../contexts";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { useWorkoutStore } from "../../../store/workout-store";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";
import type { Profile } from "../../../types/profile";
import { ToastProvider } from "../../atoms/Toast";
import { ImportDropzoneOverlay } from "./ImportDropzoneOverlay";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

async function seedActiveProfile(): Promise<void> {
  const profile: Profile = {
    id: PROFILE_ID,
    name: "Tester",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  await db.table("profiles").put(profile);
  await db.table("meta").put({ key: "activeProfileId", value: PROFILE_ID });
}

vi.mock("../../../utils/import-workout", () => ({
  importWorkout: vi.fn(),
  ImportError: class ImportError extends Error {
    format: string | null;
    cause?: unknown;
    constructor(message: string, format: string | null, cause?: unknown) {
      super(message);
      this.name = "ImportError";
      this.format = format;
      this.cause = cause;
    }
  },
}));

const mockKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Imported",
      sport: "running",
      steps: [],
    },
  },
};

function renderOverlay(
  analytics: Analytics,
  path = "/workout/new?action=import"
) {
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <PersistenceProvider persistence={createDexiePersistence(db)}>
      <AnalyticsProvider analytics={analytics}>
        <GarminBridgeProvider>
          <ToastProvider>
            <ToastContextProvider>
              <Router hook={hook}>
                <ImportDropzoneOverlay />
              </Router>
            </ToastContextProvider>
          </ToastProvider>
        </GarminBridgeProvider>
      </AnalyticsProvider>
    </PersistenceProvider>
  );
}

describe("ImportDropzoneOverlay", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.table("workouts").clear();
    await db.table("meta").clear();
    await db.table("profiles").clear();
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  it("should mount with a file input attached to the DOM", () => {
    // Arrange

    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };

    // Act

    renderOverlay(analytics);

    // Assert

    expect(screen.getByTestId("import-dropzone-overlay")).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it("should auto-click the hidden input on mount so the OS picker opens", () => {
    // Arrange

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };

    // Act

    renderOverlay(analytics);

    // Assert

    expect(clickSpy).toHaveBeenCalled();
  });

  it("should fire workout-imported with the detected format on a successful upload", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKrd);
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };
    const user = userEvent.setup();
    renderOverlay(analytics);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Act

    await user.upload(
      input,
      new File([JSON.stringify(mockKrd)], "in.krd", {
        type: "application/json",
      })
    );

    // Assert

    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalledWith("workout-imported", {
        format: "krd",
      });
    });
  });

  it("should NOT persist a workout when ?date= is absent (header-entry import)", async () => {
    // Arrange

    await seedActiveProfile();
    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKrd);
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };
    const user = userEvent.setup();
    renderOverlay(analytics, "/workout/new?action=import");
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Act

    await user.upload(
      input,
      new File([JSON.stringify(mockKrd)], "in.krd", {
        type: "application/json",
      })
    );
    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalled();
    });

    // Assert

    const rows = (await db.table("workouts").toArray()) as WorkoutRecord[];
    expect(rows).toHaveLength(0);
  });

  it("should persist a WorkoutRecord tagged with the URL date when ?date= is present", async () => {
    // Arrange

    await seedActiveProfile();
    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKrd);
    const analytics: Analytics = { pageView: vi.fn(), event: vi.fn() };
    const user = userEvent.setup();
    renderOverlay(analytics, "/workout/new?action=import&date=2026-03-15");
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Act

    await user.upload(
      input,
      new File([JSON.stringify(mockKrd)], "in.krd", {
        type: "application/json",
      })
    );

    // Assert

    await waitFor(async () => {
      const rows = (await db.table("workouts").toArray()) as WorkoutRecord[];
      expect(rows).toHaveLength(1);
      expect(rows[0]?.date).toBe("2026-03-15");
      expect(rows[0]?.profileId).toBe(PROFILE_ID);
    });
  });
});
