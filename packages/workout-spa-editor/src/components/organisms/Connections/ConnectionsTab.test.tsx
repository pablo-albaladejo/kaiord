import { render as rtlRender, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { ConnectionsTab } from "./ConnectionsTab";

// The routing rows read per-source sync freshness through the persistence
// port, so the tab no longer renders outside a provider.
const render = (ui: ReactElement) =>
  rtlRender(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      {ui}
    </PersistenceProvider>
  );

// `use-discovery-settled` is deliberately NOT mocked: it is the gate these
// tests are about, and mocking it would leave them asserting their own stub.

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: vi.fn(),
}));
vi.mock("../../../hooks/connections/use-connections-refresh", () => ({
  useConnectionsRefresh: () => ({ status: "idle", run: vi.fn() }),
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
  outdated: false,
  lastSyncAt: undefined,
  sessionVerifiable: true,
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
    // Most cases are about what the section says once discovery has settled;
    // the cold-load case places the clock itself.
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);
  });

  afterEach(() => {
    resetDiscoveryClock();
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
  it("should not assert an unverifiable extension is still present", () => {
    // Arrange
    // Tanita has no prober AND cannot be pinged — its background script routes
    // `ping` into the whole-CSV `checkSession` — so after the initial
    // announcement the SPA has no way to learn it was uninstalled. Present
    // tense would be a claim it cannot support.
    setSources([
      source({
        id: "tanita",
        name: "Tanita",
        status: "installed",
        sessionVerifiable: false,
      }),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connection-status-tanita")).toHaveTextContent(
      "Detected on load"
    );
    expect(screen.getByTestId("connection-bridge-tanita")).toHaveTextContent(
      /detected on load/i
    );
    expect(
      screen.getByText(/may have been removed since/i)
    ).toBeInTheDocument();
  });

  it("should claim no counts while discovery is still in its opening window", () => {
    // Arrange
    // The reachable failure: a hard reload with the extensions installed.
    // Discovery only installs a listener and arms a 3-second timer, so every
    // row reads undiscovered — and the store's first pass, which asks nothing
    // and settles microseconds later, must not be mistaken for an answer.
    resetDiscoveryClock(Date.now());
    setSources([source({ bridgeDetected: false, status: "available" })]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connections-summary")).toHaveAttribute(
      "data-pending",
      "true"
    );
    expect(
      screen.getByTestId("connections-summary-detected")
    ).not.toHaveTextContent("0");
  });

  it("should count detected sources once discovery has settled", () => {
    // Arrange
    setSources([
      source(),
      source({ id: "whoop", bridgeId: "whoop-bridge", bridgeDetected: false }),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(
      screen.getByTestId("connections-summary-detected")
    ).toHaveTextContent("1of 2");
  });

  it("should state the consequence of a source needing attention", () => {
    // Arrange
    setSources([source({ id: "whoop", name: "WHOOP", status: "attention" })]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connections-banner-title")).toHaveTextContent(
      "WHOOP is signed out"
    );
  });

  it("should stay silent while every source is healthy", () => {
    // Arrange
    // A banner that renders on a healthy page is a permanent false alarm, and
    // this is the state most users are in most of the time.
    setSources([source()]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.queryByTestId("connections-banner")).not.toBeInTheDocument();
  });

  it("should offer one refresh covering every bridge", () => {
    // Arrange
    setSources([source()]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connections-refresh")).toBeInTheDocument();
  });
});
