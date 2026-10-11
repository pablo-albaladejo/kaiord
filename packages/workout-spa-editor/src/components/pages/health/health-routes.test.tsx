/**
 * §8.1 — `/health`, `/health/sleep`, `/health/weight`, `/health/recovery`,
 * `/health/activity` each resolve to their dedicated page.
 *
 * Verifies the page-specific `data-testid` is mounted after the
 * Suspense fallback resolves. The route announcer integration (focus
 * + label update) is already covered by `MainLayout.test.tsx` for
 * existing routes; the new label additions are unit-tested in
 * `use-route-announcer-label.test.ts`.
 */
import type { Analytics } from "@kaiord/core";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { AppRoutes } from "../../../AppRoutes";
import { GarminBridgeProvider } from "../../../contexts/garmin-bridge-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { ToastProvider } from "../../atoms/Toast";

const analytics: Analytics = {
  pageView: vi.fn(),
  event: vi.fn(),
};

const renderAtPath = (path: string) => {
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <ThemeProvider>
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <GarminBridgeProvider>
          <ToastProvider>
            <ToastContextProvider>
              <Router hook={hook}>
                <AppRoutes analytics={analytics} />
              </Router>
            </ToastContextProvider>
          </ToastProvider>
        </GarminBridgeProvider>
      </PersistenceProvider>
    </ThemeProvider>
  );
};

// Every Health page is React.lazy. The first test to mount one paid its cold
// transform (LabEntryPage alone ~2.4 s) inside its own 5 s budget, which ran
// out when the full suite shared the CPU. Warm them once, in the first
// beforeEach: the chart pages load uPlot, which reads window.matchMedia at
// module load, and test-setup only defines matchMedia in its own beforeEach.
const COLD_IMPORT_TIMEOUT_MS = 30_000;
let warmPages: Promise<unknown> | undefined;

describe("Health Hub routes (§8.1)", () => {
  beforeEach(async () => {
    warmPages ??= Promise.all([
      import("./HealthDashboardPage"),
      import("./HealthSleepPage"),
      import("./HealthWeightPage"),
      import("./HealthRecoveryPage"),
      import("./HealthActivityPage"),
      import("./labs/LabEntryPage"),
    ]);
    await warmPages;
  }, COLD_IMPORT_TIMEOUT_MS);

  it("should mount HealthDashboardPage for /health", async () => {
    // Arrange
    renderAtPath("/health");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-dashboard")).toBeInTheDocument();
    });
  });

  it("should mount HealthSleepPage for /health/sleep", async () => {
    // Arrange
    renderAtPath("/health/sleep");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-sleep")).toBeInTheDocument();
    });
  });

  it("should mount HealthWeightPage for /health/weight", async () => {
    // Arrange
    renderAtPath("/health/weight");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-weight")).toBeInTheDocument();
    });
  });

  it("should mount HealthRecoveryPage for /health/recovery", async () => {
    // Arrange
    renderAtPath("/health/recovery");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-recovery")).toBeInTheDocument();
    });
  });

  it("should mount HealthActivityPage for /health/activity", async () => {
    // Arrange
    renderAtPath("/health/activity");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-activity")).toBeInTheDocument();
    });
  });

  it("should mount LabEntryPage for /health/labs", async () => {
    // Arrange
    renderAtPath("/health/labs");

    // Act

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("health-labs")).toBeInTheDocument();
    });
  });
});
