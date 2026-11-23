import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { ConnectionCardHeader } from "./ConnectionCardHeader";

const refresh = vi.fn();

vi.mock("../../../hooks/connections/use-connections-refresh", () => ({
  useConnectionsRefresh: () => ({ status: "idle", run: refresh }),
}));

const source = (
  over: Partial<ConnectionSource> & { status: ConnectionSourceStatus }
): ConnectionSource => ({
  id: "whoop",
  name: "WHOOP",
  mark: "Wh",
  mechanism: "bridge",
  bridgeId: "whoop-bridge",
  bridgeDetected: true,
  disconnected: false,
  connection: "working",
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...over,
});

const notice = () => screen.queryByTestId("connection-notice-whoop");

describe("ConnectionCardHeader", () => {
  beforeEach(() => {
    refresh.mockClear();
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);
  });

  afterEach(() => resetDiscoveryClock());

  it("should offer the Platform's own sign-in page when the Platform refused the sign-in", () => {
    // Arrange
    const signedOut = source({ status: "attention", connection: "signed-out" });

    // Act
    render(<ConnectionCardHeader source={signedOut} />);

    // Assert
    const region = notice();
    expect(region).toHaveTextContent(
      "You cannot use WHOOP in Kaiord until you sign in to WHOOP in this browser."
    );
    const link = within(region as HTMLElement).getByRole("link");
    expect(link).toHaveAttribute("href", "https://app.whoop.com/");
    expect(link).toHaveTextContent("Sign in to WHOOP");
    // A new tab must not hand the opener a window handle it can navigate.
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should name the outage and re-run the check when the cause is unknown", () => {
    // Arrange
    const unknown = source({
      status: "attention",
      connection: "not-answering",
    });
    render(<ConnectionCardHeader source={unknown} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    // Assert
    expect(notice()).toHaveTextContent(
      "WHOOP is not answering, so you cannot use it in Kaiord right now."
    );
    expect(notice()).not.toHaveTextContent(/sign/i);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("should tell an outdated extension to update, never to sign in", () => {
    // Arrange
    const outdated = source({ status: "attention", connection: "outdated" });

    // Act
    render(<ConnectionCardHeader source={outdated} />);

    // Assert
    expect(within(notice() as HTMLElement).getByRole("link")).toHaveTextContent(
      "Update Kaiord for WHOOP"
    );
    expect(notice()).not.toHaveTextContent(/sign in/i);
  });

  it("should hold the Install notice until discovery had its window", () => {
    // Arrange
    resetDiscoveryClock(Date.now());
    const absent = source({
      status: "available",
      bridgeDetected: false,
      connection: "not-installed",
    });

    // Act
    render(<ConnectionCardHeader source={absent} />);

    // Assert
    expect(notice()).toBeNull();
  });

  it("should offer the install once discovery settled with nothing found", () => {
    // Arrange
    const absent = source({
      status: "available",
      bridgeDetected: false,
      connection: "not-installed",
    });

    // Act
    render(<ConnectionCardHeader source={absent} />);

    // Assert
    expect(within(notice() as HTMLElement).getByRole("link")).toHaveTextContent(
      "Install Kaiord for WHOOP"
    );
  });

  it.each([
    { status: "connected" as const, connection: "working" as const },
    { status: "available" as const, connection: null },
  ])(
    "should show no notice for a Connection that works or was disconnected ($status)",
    ({ status, connection }) => {
      // Arrange
      const quiet = source({ status, connection });

      // Act
      render(<ConnectionCardHeader source={quiet} />);

      // Assert
      expect(notice()).toBeNull();
    }
  );
});
