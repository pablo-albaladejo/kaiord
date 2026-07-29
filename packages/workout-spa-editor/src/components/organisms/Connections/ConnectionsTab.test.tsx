import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { ConnectionsTab } from "./ConnectionsTab";

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: vi.fn(),
}));
vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(),
}));
vi.mock("../ProfileManager/components/useDataFlows", () => ({
  useDataFlows: vi.fn(),
}));
vi.mock("../../../hooks/use-connection-actions", () => ({
  useConnectionActions: () => ({ connect: vi.fn(), disconnect: vi.fn() }),
}));
vi.mock("../../../hooks/connections/use-bridge-import", () => ({
  useBridgeImport: () => ({ supported: true, status: "idle", run: vi.fn() }),
}));

const source = (over: Partial<ConnectionSource> = {}): ConnectionSource => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  status: "connected",
  bridgeDetected: true,
  disconnected: false,
  needsReauth: false,
  lastSyncAt: undefined,
  importTypes: ["activity"],
  exportTypes: [],
  ...over,
});

const setSources = (sources: ConnectionSource[]) =>
  vi.mocked(useConnectionSources).mockReturnValue(sources);

describe("ConnectionsTab", () => {
  beforeEach(() => {
    vi.mocked(useActiveProfileLive).mockReturnValue({
      id: "p1",
    } as ReturnType<typeof useActiveProfileLive>);
    vi.mocked(useDataFlows).mockReturnValue({
      policies: [],
      byDataType: new Map(),
      hasAny: false,
    });
  });

  it("should give every card an addressable test id and status", () => {
    // Arrange
    setSources([source(), source({ id: "tanita", status: "installed" })]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connection-card-garmin")).toHaveAttribute(
      "data-status",
      "connected"
    );
    expect(screen.getByTestId("connection-card-tanita")).toHaveAttribute(
      "data-status",
      "installed"
    );
  });

  it("should call a discovered-but-never-probed source installed, not connected", () => {
    // Arrange
    setSources([source({ id: "tanita", name: "Tanita", status: "installed" })]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connection-status-tanita")).toHaveTextContent(
      "Extension installed"
    );
  });

  it("should say a session is signed out rather than that a token expired", () => {
    // Arrange
    setSources([source({ id: "whoop", name: "WHOOP", status: "attention" })]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    // No bridge can tell an expired credential from one never issued, so the
    // stronger claim is not available to make.
    expect(screen.getByTestId("connection-status-whoop")).toHaveTextContent(
      "Session signed out"
    );
  });

  it("should offer reconnect only for a disconnected source whose extension is present", () => {
    // Arrange
    setSources([
      source({ status: "available", disconnected: true, bridgeDetected: true }),
      source({
        id: "whoop",
        status: "available",
        disconnected: false,
        bridgeDetected: false,
      }),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(
      screen.getByTestId("connection-reconnect-garmin")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("connection-reconnect-whoop")
    ).not.toBeInTheDocument();
  });

  it("should reveal what a source moves only after Manage is opened", async () => {
    // Arrange
    const user = userEvent.setup();
    setSources([source({ importTypes: ["activity", "workout"] })]);
    render(<ConnectionsTab />);

    // Act
    await user.click(screen.getByTestId("connection-manage-garmin"));

    // Assert
    expect(screen.getByText("Activity · Workout")).toBeInTheDocument();
    expect(
      screen.getByTestId("connection-disconnect-garmin")
    ).toBeInTheDocument();
  });

  it("should list an unsupported brand without any control", () => {
    // Arrange
    setSources([
      source({
        id: "strava",
        name: "Strava",
        mechanism: "not-supported",
        bridgeId: null,
        status: "unsupported",
        bridgeDetected: false,
        importTypes: [],
      }),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connections-unsupported")).toBeInTheDocument();
    expect(
      screen.queryByTestId("connection-manage-strava")
    ).not.toBeInTheDocument();
  });

  it("should point a disconnected source at the missing extension first", () => {
    // Arrange
    // Both facts are true; the absent extension is the blocking one, and
    // there is no Reconnect control while it is gone.
    setSources([
      source({
        status: "available",
        disconnected: true,
        bridgeDetected: false,
      }),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(
      screen.getByText(/extension is not running in this browser/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("connection-reconnect-garmin")
    ).not.toBeInTheDocument();
  });
});
