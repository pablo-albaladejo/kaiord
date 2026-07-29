import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { renderWithProviders } from "../../../test-utils";
import SettingsPage from "./SettingsPage";

vi.mock("../../../contexts/garmin-bridge-context", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useGarminBridge: () => ({
      extensionInstalled: false,
      sessionActive: false,
      pushing: { status: "idle" },
      lastError: null,
      detectExtension: vi.fn(),
      pushWorkout: vi.fn(),
      listWorkouts: vi.fn(),
      setPushing: vi.fn(),
    }),
  };
});

vi.mock("../../../store/train2go-store", () => ({
  useTrain2GoStore: () => ({
    extensionInstalled: false,
    sessionActive: false,
    lastError: null,
    detectExtension: vi.fn(),
  }),
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

    it("should render every group eyebrow", () => {
      // Arrange
      const eyebrows = ["Your data", "AI", "Preferences", "About"];

      // Act
      renderAtPath("/settings");

      // Assert
      for (const eyebrow of eyebrows) {
        expect(screen.getByText(eyebrow)).toBeInTheDocument();
      }
    });

    it("should show the truthful local-storage value on the privacy row", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-row-dataPrivacy")).toHaveTextContent(
        "Stored in this browser"
      );
    });

    it("should link Help & docs out to the documentation site", () => {
      // Arrange

      // Act
      renderAtPath("/settings");

      // Assert
      expect(screen.getByTestId("settings-row-helpDocs")).toHaveAttribute(
        "href",
        "https://kaiord.com/docs/"
      );
    });

    it.each([
      // TODO(S3): destination becomes /settings/connections once it exists.
      { row: "connections", destination: "/athlete" },
      { row: "googleDriveSync", destination: "/settings/sync" },
      { row: "extensions", destination: "/settings/extensions" },
      { row: "dataHub", destination: "/settings/data-hub" },
      { row: "usage", destination: "/settings/usage" },
      { row: "units", destination: "/settings/preferences" },
      { row: "language", destination: "/settings/preferences" },
      {
        row: "manageYourData",
        destination: "/settings/privacy?section=data-management",
      },
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
      { tab: "privacy", content: "Clear All API Keys" },
      { tab: "extensions", content: "Garmin Connect" },
      { tab: "extensions", content: "Train2Go" },
    ])(
      "should render the $tab tab content at /settings/$tab",
      ({ tab, content }) => {
        // Arrange

        // Act
        renderAtPath(`/settings/${tab}`);

        // Assert
        // getAllByText: the extensions tab also renders "Garmin Connect"
        // inside the Tanita sync card's instructional copy.
        expect(screen.getAllByText(content)[0]).toBeInTheDocument();
      }
    );

    it("should render the usage tab content at /settings/usage", async () => {
      // Arrange

      // Act
      renderAtPath("/settings/usage");

      // Assert
      expect(
        await screen.findByTestId("settings-panel-usage")
      ).toBeInTheDocument();
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
        "ai",
        "sync",
        "data-hub",
        "extensions",
        "usage",
        "privacy",
        "preferences",
      ];

      // Act
      renderAtPath("/settings/ai");

      // Assert
      const rail = screen.getByTestId("settings-section-rail");
      expect(rail.querySelectorAll("button")).toHaveLength(sections.length);
      for (const id of sections) {
        expect(
          screen.getByTestId(`settings-section-${id}`)
        ).toBeInTheDocument();
      }
    });

    // `/settings/preferences` is the case that matters: three index rows
    // (units, language, notifications) share that destination, so a
    // row-shaped rail marked all three current at once.
    it.each([
      { path: "/settings/preferences", section: "preferences" },
      { path: "/settings/ai", section: "ai" },
      { path: "/settings/privacy", section: "privacy" },
      { path: "/settings/sync", section: "sync" },
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
      const { container } = renderAtPath("/settings/preferences");

      // Assert
      expect(
        container.querySelectorAll('[data-testid^="settings-row-"]')
      ).toHaveLength(0);
    });

    it.each([{ path: "/settings" }, { path: "/settings/extensions" }])(
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

    it("should render no attention surface while nothing computes one", () => {
      // Arrange

      // Act
      renderAtPath("/settings/ai");

      // Assert
      expect(
        screen.queryByTestId("settings-attention-banner")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("settings-attention-chip")
      ).not.toBeInTheDocument();
    });
  });

  describe("legacy sections", () => {
    it.each([{ section: "data-hub" }, { section: "extensions" }])(
      "should keep /settings/$section resolving to its own panel",
      ({ section }) => {
        // Arrange

        // Act
        const { memory } = renderAtPath(`/settings/${section}`);

        // Assert
        expect(
          screen.getByTestId(`settings-panel-${section}`)
        ).toBeInTheDocument();
        expect(memory.history.at(-1)).toBe(`/settings/${section}`);
      }
    );
  });

  describe("section deep-links", () => {
    const sectionOf = () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        "data-settings-section"
      ) ?? null;

    it.each([
      { path: "/settings/ai?section=providers", section: "providers" },
      {
        path: "/settings/privacy?section=data-management",
        section: "data-management",
      },
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
