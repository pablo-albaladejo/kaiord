import { render as rtlRender, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectionFixHref } from "../../../application/connections/connection-fix-target";
import type { ConnectionSource } from "../../../application/connections/connection-source";
import { CapabilitiesFixture } from "../../../contexts/capabilities-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useDataFlows } from "../../../hooks/connections/use-data-flows";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { ConnectionsTab } from "./ConnectionsTab";

const render = (ui: ReactElement) =>
  rtlRender(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      <CapabilitiesFixture on={[]}>{ui}</CapabilitiesFixture>
    </PersistenceProvider>
  );

vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: vi.fn(),
}));
vi.mock("../../../hooks/connections/use-connections-refresh", () => ({
  useConnectionsRefresh: () => ({ status: "idle", run: vi.fn() }),
}));
vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(),
}));
vi.mock("../../../hooks/connections/use-data-flows", () => ({
  useDataFlows: vi.fn(),
}));
vi.mock("../../../hooks/use-connection-actions", () => ({
  useConnectionActions: () => ({ connect: vi.fn(), disconnect: vi.fn() }),
}));
vi.mock("../../../hooks/connections/use-bridge-import", () => ({
  useBridgeImport: () => ({ supported: true, status: "idle", run: vi.fn() }),
}));

const bridge = (id: string, detected: boolean): ConnectionSource => ({
  id,
  name: id,
  mark: id[0] ?? "?",
  mechanism: "bridge",
  bridgeId: `${id}-bridge`,
  status: "available",
  bridgeDetected: detected,
  disconnected: false,
  connection: detected ? "working" : "not-installed",
  lastSyncAt: undefined,
  sessionVerifiable: true,
  importTypes: ["activity"],
  exportTypes: [],
});

const IDS = ["garmin", "train2go", "whoop", "tanita", "trainingpeaks"];

describe("ConnectionsTab without its extensions", () => {
  beforeEach(() => {
    vi.mocked(useActiveProfileLive).mockReturnValue({
      id: "p1",
    } as ReturnType<typeof useActiveProfileLive>);
    vi.mocked(useDataFlows).mockReturnValue({
      policies: [],
      byDataType: new Map(),
      hasAny: false,
    });
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);
  });

  afterEach(() => resetDiscoveryClock());

  it("should give every card its own Install notice, naming its Platform", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue(
      IDS.map((id) => bridge(id, false))
    );

    // Act
    render(<ConnectionsTab />);

    // Assert
    for (const id of IDS) {
      const notice = screen.getByTestId(`connection-notice-${id}`);
      expect(notice).toHaveTextContent(
        `You cannot use ${id} in Kaiord until Kaiord for ${id} is installed in this browser.`
      );
      expect(
        within(notice).getByRole("link", { name: `Install Kaiord for ${id}` })
      ).toHaveAttribute("href", connectionFixHref("install", `${id}-bridge`));
    }
    expect(screen.queryByText(/the kaiord extension/i)).not.toBeInTheDocument();
  });

  it("should offer no install on a card whose extension answered", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue([
      bridge("garmin", true),
      bridge("whoop", false),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.queryByTestId("connection-notice-garmin")).toBeNull();
    expect(screen.getByTestId("connection-notice-whoop")).toBeInTheDocument();
  });

  it("should not call the jargon word bridge in the copy it shows", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue([bridge("garmin", false)]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(screen.getByTestId("connection-card-garmin")).not.toHaveTextContent(
      /bridge/i
    );
  });
});
