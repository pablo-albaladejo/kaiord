import { render as rtlRender, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { CapabilitiesFixture } from "../../../contexts/capabilities-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { useConnectionSources } from "../../../hooks/connections/use-connection-sources";
import { useDataFlows } from "../../../hooks/connections/use-data-flows";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { loadLocaleNamespaces } from "../../../i18n/resources";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { ConnectionsTab } from "./ConnectionsTab";

// Where the athlete connects a Platform, the public register of unofficial
// access per Platform (#1631, ADR 0002) is one link away.
const REGISTER = "https://kaiord.com/docs/legal/platform-access";

const render = (ui: ReactElement) =>
  rtlRender(
    <PersistenceProvider persistence={createInMemoryPersistence()}>
      <CapabilitiesFixture on={[]}>{ui}</CapabilitiesFixture>
    </PersistenceProvider>
  );

const locale = vi.hoisted(() => ({ active: "en" as "en" | "es" }));
vi.mock("../../../i18n/LocaleProvider", () => ({
  useActiveLocale: () => locale.active,
}));
vi.mock("../../../hooks/connections/use-connection-sources", () => ({
  useConnectionSources: vi.fn(),
}));
vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(),
}));
vi.mock("../../../hooks/connections/use-data-flows", () => ({
  useDataFlows: vi.fn(),
}));

describe("ConnectionsTab platform access link", () => {
  // Spanish is code-split; load its catalog once before rendering in it.
  beforeAll(async () => {
    await loadLocaleNamespaces("es");
  });

  beforeEach(() => {
    vi.mocked(useActiveProfileLive).mockReturnValue({
      id: "p1",
    } as ReturnType<typeof useActiveProfileLive>);
    vi.mocked(useDataFlows).mockReturnValue({
      policies: [],
      byDataType: new Map(),
      hasAny: false,
    });
    vi.mocked(useConnectionSources).mockReturnValue([]);
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS);
  });

  afterEach(() => {
    locale.active = "en";
    resetDiscoveryClock();
  });

  it("should link to the platform access register in English", () => {
    // Arrange
    locale.active = "en";

    // Act
    render(<ConnectionsTab />);

    // Assert
    const link = screen.getByRole("link", {
      name: "How Kaiord reaches each platform, and the risk",
    });
    expect(link).toHaveAttribute("href", REGISTER);
  });

  it("should link to the platform access register in Spanish", () => {
    // Arrange
    locale.active = "es";

    // Act
    render(<ConnectionsTab />);

    // Assert
    const link = screen.getByRole("link", {
      name: "Cómo llega Kaiord a cada plataforma, y el riesgo",
    });
    expect(link).toHaveAttribute("href", REGISTER);
  });
});
