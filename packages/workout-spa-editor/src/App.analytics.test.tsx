/**
 * App analytics integration tests.
 *
 * Verifies that pageView is fired on initial mount and on every wouter
 * route change.
 */
import type { Analytics } from "@kaiord/core";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import App from "./App";
import { ToastProvider } from "./components/atoms/Toast";
import {
  AnalyticsProvider,
  GarminBridgeProvider,
  SettingsDialogProvider,
  ThemeProvider,
} from "./contexts";
import { PersistenceProvider } from "./contexts/persistence-context";
import { ToastContextProvider } from "./contexts/ToastContext";
import { useWorkoutStore } from "./store/workout-store";
import { createInMemoryPersistence } from "./test-utils/in-memory-persistence";

type RenderArgs = {
  path: string;
  analytics: Analytics;
};

function renderAtPath({ path, analytics }: RenderArgs) {
  const { hook, navigate } = memoryLocation({ path, record: true });

  const result = render(
    <AnalyticsProvider analytics={analytics}>
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <ThemeProvider>
          <SettingsDialogProvider>
            <GarminBridgeProvider>
              <ToastProvider>
                <ToastContextProvider>
                  <Router hook={hook}>
                    <App />
                  </Router>
                </ToastContextProvider>
              </ToastProvider>
            </GarminBridgeProvider>
          </SettingsDialogProvider>
        </ThemeProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  );

  return { ...result, navigate };
}

describe("App analytics", () => {
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
    localStorage.setItem("workout-spa-onboarding-completed", "true");
  });

  it("should fire pageView on initial mount with the current path", async () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    // Act
    renderAtPath({ path: "/calendar", analytics });

    // Assert
    await waitFor(() => {
      expect(analytics.pageView).toHaveBeenCalledWith("/calendar");
    });
  });

  it("should fire pageView on client-side navigation", async () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };
    const { navigate } = renderAtPath({ path: "/calendar", analytics });

    // Confirm initial pageView fired
    await waitFor(() => {
      expect(analytics.pageView).toHaveBeenCalledWith("/calendar");
    });

    // Act
    navigate("/library");

    // Assert
    await waitFor(() => {
      expect(analytics.pageView).toHaveBeenCalledWith("/library");
    });
  });

  it("should fire pageView with full path including dynamic segments", async () => {
    // Arrange
    const analytics: Analytics = {
      pageView: vi.fn(),
      event: vi.fn(),
    };

    // Act
    renderAtPath({ path: "/workout/abc123", analytics });

    // Assert
    await waitFor(() => {
      expect(analytics.pageView).toHaveBeenCalledWith("/workout/abc123");
    });
  });
});
