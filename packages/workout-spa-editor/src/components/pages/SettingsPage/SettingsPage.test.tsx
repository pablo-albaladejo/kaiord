import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { DISCOVERY_SETTLE_MS } from "../../../hooks/connections/use-discovery-settled";
import { resetDiscoveryClock } from "../../../hooks/discovery-clock";
import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { renderWithProviders } from "../../../test-utils";
import SettingsPage from "./SettingsPage";

const CHECKED_AT = 1_700_000_000_000;

const KNOWN_BRIDGES = [
  "garmin-bridge",
  "whoop-bridge",
  "train2go-bridge",
  "tanita-bridge",
  "trainingpeaks-bridge",
];

const bridgeConnection = (
  bridgeId: string,
  overrides: Partial<BridgeConnectionState> = {}
): BridgeConnectionState => ({
  bridgeId,
  discovered: false,
  sessionActive: false,
  checking: false,
  error: null,
  needsReauth: false,
  outdated: false,
  lastCheckedAt: null,
  lastSyncAt: undefined,
  ...overrides,
});

const connections = vi.hoisted(() => ({
  value: [] as BridgeConnectionState[],
}));

vi.mock("../../../hooks/use-bridge-connections", () => ({
  useBridgeConnections: () => connections.value,
}));

function renderAtPath(path: string) {
  const memory = memoryLocation({ path, record: true });
  const result = renderWithProviders(
    <Router hook={memory.hook}>
      <Route path="/settings/:section?">
        <SettingsPage />
      </Route>
    </Router>,
    { persistence: createDexiePersistence(db) }
  );
  return { ...result, memory };
}

describe("SettingsPage", () => {
  beforeEach(async () => {
    connections.value = KNOWN_BRIDGES.map((id) => bridgeConnection(id));
    // The connections row is gated on discovery having had its window, and
    // that window is wall-clock. Placing the clock per test is the difference
    // between asserting the gate and asserting how fast the suite happens to
    // run: left alone, the "still settling" case passes only while the file
    // finishes inside DISCOVERY_SETTLE_MS, and fails under coverage.
    resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS - 1);
    await Promise.all([
      db.table("aiProviders").clear(),
      db.table("meta").clear(),
      db.table("profiles").clear(),
    ]);
    useAiRuntimeStore.setState({
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  describe("landing list", () => {
    it("should render the grouped list at /settings with no tab", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-group-list")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings"
      );
    });

    it("should edit the general preferences in place, without a click into a page", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      const general = screen.getByTestId("settings-general");
      expect(general).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Imperial" })).toBeVisible();
      expect(
        screen.queryByTestId("settings-row-general")
      ).not.toBeInTheDocument();
    });

    it("should list one row per page, in the rail's order and with the rail's names", () => {
      // Arrange
      const index = renderAtPath("/settings");
      const indexNames = [
        screen.getByTestId("settings-general-heading"),
        ...index.container.querySelectorAll("[data-settings-row-label]"),
      ].map((el) => el.textContent?.trim() ?? "");
      index.unmount();

      // Act
      renderAtPath("/settings/ai");

      // Assert
      const railNames = Array.from(
        screen.getByTestId("settings-section-rail").querySelectorAll("a")
      ).map((a) => a.textContent?.trim() ?? "");
      expect(indexNames).toEqual(railNames);
    });

    it("should show the truthful local-storage value on the data row", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-row-data")).toHaveTextContent(
        "Stored in this browser"
      );
    });

    it("should link Help & docs out to the documentation site from About", () => {
      // Arrange

      // Act
      renderAtPath("/settings/about");

      // Assert
      expect(screen.getByTestId("settings-about-help")).toHaveAttribute(
        "href",
        "https://kaiord.com/docs/"
      );
    });

    it.each([
      { row: "ai", destination: "/settings/ai" },
      { row: "sync", destination: "/settings/sync" },
      { row: "data", destination: "/settings/data" },
      { row: "privacy", destination: "/settings/privacy" },
      { row: "about", destination: "/settings/about" },
      { row: "connections", destination: "/settings/connections" },
    ])(
      "should navigate to $destination when clicking the $row row",
      async ({ row, destination }) => {
        // Arrange
        const user = userEvent.setup();
        const { memory } = renderAtPath("/settings");

        // Act
        await user.click(screen.getByTestId(`settings-row-${row}`));

        // Assert
        await waitFor(() => {
          expect(memory.history.at(-1)).toBe(destination);
        });
      }
    );
  });

  describe("routing", () => {
    it("should redirect unknown tab to /settings", () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings/unknown");

      // Assert
      expect(memory.history.at(-1)).toBe("/settings");
    });

    it.each([
      { segment: "toString" },
      { segment: "constructor" },
      { segment: "hasOwnProperty" },
    ])(
      "should send the inherited property name $segment to the index",
      ({ segment }) => {
        // Arrange
        // The segment comes straight off the URL. Looked up on an object
        // literal, every `Object.prototype` member answers with a function, so
        // these resolved as "retired sections" and redirected to a path built
        // by interpolating it.

        // Act
        const { memory } = renderAtPath(`/settings/${segment}`);

        // Assert
        expect(memory.history.at(-1)).toBe("/settings");
      }
    );

    it.each([
      { from: "/settings/extensions", to: "/settings/connections" },
      { from: "/settings/data-hub", to: "/settings/connections" },
      { from: "/settings/preferences", to: "/settings/general" },
      { from: "/settings/usage", to: "/settings/ai?section=usage" },
      {
        from: "/settings/privacy?section=data-management",
        to: "/settings/data",
      },
    ])("should send the old link $from to $to", ({ from, to }) => {
      // Arrange

      // Act
      const { memory } = renderAtPath(from);

      // Assert
      expect(memory.history).toEqual([to]);
    });
  });

  describe("detail views", () => {
    it("should render the page shell for a valid tab", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings · AI"
      );
    });

    it.each([
      { tab: "ai", content: "LLM Providers" },
      { tab: "privacy", content: "Privacy Information" },
      { tab: "data", content: "Delete all my data" },
      { tab: "general", content: "Theme" },
    ])(
      "should render the $tab tab content at /settings/$tab",
      ({ tab, content }) => {
        // Arrange

        // Act
        renderAtPath(`/settings/${tab}`);

        // Assert
        expect(screen.getAllByText(content)[0]).toBeInTheDocument();
      }
    );

    it("should render the connections tab content at /settings/connections", async () => {
      // Arrange

      // Act
      renderAtPath("/settings/connections");

      // Assert
      expect(
        await screen.findByTestId("settings-panel-connections")
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings · Connections"
      );
    });

    it("should render the AI usage inside the AI page", async () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      const panel = await screen.findByTestId("settings-panel-ai");
      expect(
        panel.querySelector('[data-settings-section="usage"]')
      ).not.toBeNull();
    });

    it("should keep the export, the import and the wipe off the privacy page", () => {
      // Arrange

      // Act
      renderAtPath("/settings/privacy");

      // Assert
      expect(
        screen.queryByRole("button", { name: "Export my data" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Delete all my data" })
      ).not.toBeInTheDocument();
    });
  });

  describe("back navigation", () => {
    it("should navigate back to /settings from a detail view", async () => {
      // Arrange
      const user = userEvent.setup();
      const { memory } = renderAtPath("/settings/ai");

      // Act
      await user.click(screen.getByTestId("settings-back"));

      // Assert
      await waitFor(() => {
        expect(memory.history.at(-1)).toBe("/settings");
      });
    });
  });

  describe("split shell", () => {
    it("should render the index without the section rail at /settings", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-group-list")).toBeInTheDocument();
      expect(
        screen.queryByTestId("settings-section-rail")
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("settings-panel-ai")).not.toBeInTheDocument();
    });

    it("should replace the index with the rail and the panel for a section", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(screen.getByTestId("settings-panel-ai")).toBeInTheDocument();
      // The rail is a CSS-only affordance: absent below `md`, present above.
      expect(screen.getByTestId("settings-section-rail")).toHaveClass(
        "hidden",
        "md:block"
      );
      expect(
        screen.queryByTestId("settings-group-list")
      ).not.toBeInTheDocument();
    });

    it("should render one rail entry per section", () => {
      // Arrange
      const sections = [
        "general",
        "ai",
        "sync",
        "data",
        "privacy",
        "about",
        "connections",
      ];

      // Act
      renderAtPath("/settings/ai");

      // Assert
      const rail = screen.getByTestId("settings-section-rail");
      // Anchors, not buttons: these navigate to URLs and expose
      // `aria-current="page"`, so they must keep native link behaviour and
      // must not be announced as buttons.
      expect(rail.querySelectorAll("a[href]")).toHaveLength(sections.length);
      for (const id of sections) {
        const entry = screen.getByTestId(`settings-section-${id}`);
        expect(entry).toBeInTheDocument();
        expect(entry).toHaveAttribute("href", `/settings/${id}`);
      }
    });

    it.each([
      { path: "/settings/general", section: "general" },
      { path: "/settings/ai", section: "ai" },
      { path: "/settings/sync", section: "sync" },
      { path: "/settings/data", section: "data" },
      { path: "/settings/privacy", section: "privacy" },
      { path: "/settings/about", section: "about" },
    ])(
      "should mark exactly one entry current at $path",
      ({ path, section }) => {
        // Arrange

        // Act
        const { container } = renderAtPath(path);

        // Assert
        const current = container.querySelectorAll('[aria-current="page"]');
        expect(current).toHaveLength(1);
        expect(current[0]).toBe(
          screen.getByTestId(`settings-section-${section}`)
        );
      }
    );

    it("should navigate laterally from a rail entry", async () => {
      // Arrange
      const user = userEvent.setup();
      const { memory } = renderAtPath("/settings/ai");

      // Act
      await user.click(screen.getByTestId("settings-section-privacy"));

      // Assert
      await waitFor(() => {
        expect(memory.history.at(-1)).toBe("/settings/privacy");
      });
    });

    it("should keep the rail free of the index's row test ids", () => {
      // Arrange

      // Act
      const { container } = renderAtPath("/settings/general");

      // Assert
      expect(
        container.querySelectorAll('[data-testid^="settings-row-"]')
      ).toHaveLength(0);
      expect(screen.getAllByTestId("settings-general")).toHaveLength(1);
    });

    it.each([{ path: "/settings" }, { path: "/settings/connections" }])(
      "should expose exactly one route heading at $path",
      ({ path }) => {
        // Arrange

        // Act
        const { container } = renderAtPath(path);

        // Assert
        expect(container.querySelectorAll("[data-route-heading]")).toHaveLength(
          1
        );
      }
    );

    it.each([{ path: "/settings" }, { path: "/settings/ai" }])(
      "should render no attention surface at $path while every connection is healthy",
      ({ path }) => {
        // Arrange

        // Act
        renderAtPath(path);

        // Assert
        expect(
          screen.queryByTestId("settings-attention-banner")
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("settings-attention-chip")
        ).not.toBeInTheDocument();
      }
    );
  });

  describe("attention", () => {
    // `lastCheckedAt` has to be set: a probed bridge with no answer on record
    // is "checking", not broken, so a null here would silently assert nothing.
    const broken = () => [
      bridgeConnection("garmin-bridge", {
        discovered: true,
        sessionActive: true,
        lastCheckedAt: CHECKED_AT,
      }),
      bridgeConnection("whoop-bridge", {
        discovered: true,
        error: "Session expired",
        lastCheckedAt: CHECKED_AT,
      }),
    ];

    it("should announce the affected count on the index banner", () => {
      // Arrange
      connections.value = broken();

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-attention-banner")).toHaveTextContent(
        "1 connection needs attention"
      );
      expect(
        screen.queryByTestId("settings-attention-chip")
      ).not.toBeInTheDocument();
    });

    it("should move the announcement to the rail chip inside a section", () => {
      // Arrange
      connections.value = broken();

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(screen.getByTestId("settings-attention-chip")).toHaveTextContent(
        "1 connection needs attention"
      );
      expect(
        screen.queryByTestId("settings-attention-banner")
      ).not.toBeInTheDocument();
    });

    it("should count the detected bridges on the connections row", () => {
      // Arrange
      connections.value = KNOWN_BRIDGES.map((id, index) =>
        bridgeConnection(id, { discovered: index < 2 })
      );

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-row-connections")).toHaveTextContent(
        "2 of 5 detected"
      );
    });

    // Fails on the reachable regression: a reader with five working
    // extensions opens Settings before any has announced and is told "0 of 5".
    it("should leave the connections row bare while discovery has its window", () => {
      // Arrange — cold load: five rows, none discovered, discovery just began.
      resetDiscoveryClock(Date.now());

      // Act
      renderAtPath("/settings");

      // Assert
      expect(
        screen.getByTestId("settings-row-connections")
      ).not.toHaveTextContent("of 5");
    });

    // The companion: without it the test above would also pass if the gate
    // never opened, leaving a reader with no extensions permanently blank.
    it("should state a zero count once discovery's window has closed", () => {
      // Arrange
      resetDiscoveryClock(Date.now() - DISCOVERY_SETTLE_MS - 1);

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-row-connections")).toHaveTextContent(
        "0 of 5 detected"
      );
    });
  });

  describe("retired sections", () => {
    // Entering at the OLD path is the whole point: rendering the new one and
    // asserting it works would pass with the redirect deleted.
    it.each([{ section: "data-hub" }, { section: "extensions" }])(
      "should land a visitor to /settings/$section on Connections",
      async ({ section }) => {
        // Arrange

        // Act
        const { memory } = renderAtPath(`/settings/${section}`);

        // Assert
        expect(
          await screen.findByTestId("settings-panel-connections")
        ).toBeInTheDocument();
        expect(memory.history.at(-1)).toBe("/settings/connections");
      }
    );

    it("should replace the retired entry so Back does not bounce onto it", () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings/extensions");

      // Assert
      expect(memory.history).toEqual(["/settings/connections"]);
    });

    it("should keep a genuinely unknown section falling back to the index", () => {
      // Arrange

      // Act
      const { memory } = renderAtPath("/settings/nope");

      // Assert
      expect(memory.history.at(-1)).toBe("/settings");
      expect(
        screen.queryByTestId("settings-panel-connections")
      ).not.toBeInTheDocument();
    });

    it("should drop the retired rows from the settings index", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(
        screen.queryByTestId("settings-row-extensions")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("settings-row-dataHub")
      ).not.toBeInTheDocument();
    });
  });

  describe("section deep-links", () => {
    const sectionOf = () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-settings-section"
      ) ?? null;

    it.each([
      { path: "/settings/ai?section=providers", section: "providers" },
      { path: "/settings/ai?section=usage", section: "usage" },
    ])(
      "should focus the $section section for its query",
      async ({ path, section }) => {
        // Arrange

        // Act
        renderAtPath(path);

        // Assert
        await waitFor(() => {
          expect(sectionOf()).toBe(section);
        });
      }
    );

    it("should focus no section when the query is absent", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(sectionOf()).toBeNull();
    });
  });
});
