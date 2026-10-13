import { render as rtlRender, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { BRIDGE_DOCS_URL } from "../../molecules/CalendarEmptyStates/first-run-steps";
import { useDataFlows } from "../ProfileManager/components/useDataFlows";
import { ConnectionsTab } from "./ConnectionsTab";

const render = (ui: ReactElement) =>
  rtlRender(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      {ui}
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
vi.mock("../ProfileManager/components/useDataFlows", () => ({
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
  needsReauth: false,
  outdated: false,
  lastSyncAt: undefined,
  sessionVerifiable: true,
  importTypes: ["activity"],
  exportTypes: [],
});

const IDS = ["garmin", "train2go", "whoop", "tanita", "trainingpeaks"];

describe("ConnectionsTab without the Kaiord extension", () => {
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

  it("should show one banner with the install action when no extension is detected", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue(
      IDS.map((id) => bridge(id, false))
    );

    // Act
    render(<ConnectionsTab />);

    // Assert
    const banner = screen.getByTestId("connections-extension-banner");
    const link = within(banner).getByRole("link", {
      name: "Install Kaiord extension",
    });
    expect(link).toHaveAttribute("href", BRIDGE_DOCS_URL);
  });

  it("should say each card requires the extension without repeating the long paragraph", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue(
      IDS.map((id) => bridge(id, false))
    );

    // Act
    render(<ConnectionsTab />);

    // Assert
    for (const id of IDS) {
      const card = screen.getByTestId(`connection-card-${id}`);
      expect(card).toHaveTextContent("Requires the Kaiord extension");
      expect(
        within(card).getByRole("link", { name: "Install Kaiord extension" })
      ).toHaveAttribute("href", BRIDGE_DOCS_URL);
    }
    expect(
      screen.queryByText(/not running in this browser/i)
    ).not.toBeInTheDocument();
  });

  it("should show no banner once any extension is detected", () => {
    // Arrange
    vi.mocked(useConnectionSources).mockReturnValue([
      bridge("garmin", true),
      bridge("whoop", false),
    ]);

    // Act
    render(<ConnectionsTab />);

    // Assert
    expect(
      screen.queryByTestId("connections-extension-banner")
    ).not.toBeInTheDocument();
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
