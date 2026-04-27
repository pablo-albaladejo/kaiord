/**
 * Analytics integration tests for EditorNewWorkout.
 *
 * Verifies that `workout-created` is fired with `source: "manual"` when
 * a manual workout save succeeds.
 */
import type { Analytics } from "@kaiord/core";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnalyticsProvider,
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "../../contexts";
import { ToastContextProvider } from "../../contexts/ToastContext";
import { useWorkoutStore } from "../../store/workout-store";
import { ToastProvider } from "../atoms/Toast";
import { EditorNewWorkout } from "./EditorNewWorkout";

function renderEditorNewWorkout(analytics: Analytics, children: ReactNode) {
  return render(
    <AnalyticsProvider analytics={analytics}>
      <ThemeProvider>
        <SettingsDialogProvider>
          <GarminBridgeProvider>
            <ToastProvider>
              <ToastContextProvider>{children}</ToastContextProvider>
            </ToastProvider>
          </GarminBridgeProvider>
        </SettingsDialogProvider>
      </ThemeProvider>
    </AnalyticsProvider>
  );
}

describe("EditorNewWorkout analytics", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
      safeMode: false,
      lastBackup: null,
      deletedSteps: [],
    });
    localStorage.clear();
  });

  it("fires workout-created with source=manual when a manual workout is saved", async () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };
    const user = userEvent.setup();

    const { getByText, getByLabelText, getByRole } = renderEditorNewWorkout(
      analytics,
      <EditorNewWorkout workout={undefined} />
    );

    // Expand the manual create section
    await user.click(getByText(/or create manually/i));

    // Open the create dialog
    await user.click(getByRole("button", { name: /create empty workout/i }));

    // Fill the workout name input
    const nameInput = await waitFor(() => getByLabelText(/name/i));
    await user.type(nameInput, "My manual workout");

    // Act — submit
    const submitButton = getByRole("button", { name: /^create$/i });
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(analytics.event).toHaveBeenCalledWith("workout-created", {
        source: "manual",
      });
    });
  });
});
