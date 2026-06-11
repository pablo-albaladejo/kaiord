import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { createProfile } from "../../../application/profile/create-profile";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import { LayoutHeader } from "./LayoutHeader";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return { ui: <Router hook={loc.hook}>{ui}</Router>, location: loc };
}

describe("LayoutHeader", () => {
  beforeEach(async () => {
    useWorkoutStore.setState({
      currentWorkout: null,
      undoHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
    await Promise.all([
      db.table("profiles").clear(),
      db.table("meta").clear(),
      db.table("templates").clear(),
    ]);
  });

  describe("rendering", () => {
    it.each<[string, () => HTMLElement]>([
      ["brand label", () => screen.getByLabelText(/kaiord editor/i)],
      [
        "profile entry button",
        () => screen.getByTestId("status-header-profile-button"),
      ],
      [
        "help entry button",
        () => screen.getByRole("button", { name: /open help/i }),
      ],
      [
        "settings entry button",
        () => screen.getByRole("button", { name: /open settings/i }),
      ],
      [
        "theme toggle",
        () =>
          screen.getByRole("button", { name: /switch to (light|dark) mode/i }),
      ],
    ])("should render the %s", (_label, query) => {
      // Arrange

      renderWithProviders(<LayoutHeader />);

      // Act

      const element = query();

      // Assert

      expect(element).toBeInTheDocument();
    });

    it("should always render the StatusHeader (no feature flag gate)", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(screen.getByTestId("status-header")).toBeInTheDocument();
    });
  });

  describe("active profile surface", () => {
    it("should show 'No profile' in the profile button when no active profile is loaded", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByTestId("status-header-profile-button")
      ).toHaveTextContent("No profile");
    });

    it("should show the active profile name once Dexie hydrates", async () => {
      // Arrange
      const persistence = createDexiePersistence(db);
      await createProfile(persistence, "My Training Profile");

      // Act
      renderWithProviders(<LayoutHeader />, { persistence });

      // Assert
      expect(
        await screen.findByText(/my training profile/i)
      ).toBeInTheDocument();
    });
  });

  describe("entry-button navigation", () => {
    it("should navigate to /athlete when the profile button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(screen.getByTestId("status-header-profile-button"));

      // Assert
      expect(location.history).toContain("/athlete");
    });

    it("should navigate to /settings when the settings button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(screen.getByRole("button", { name: /open settings/i }));

      // Assert
      expect(location.history).toContain("/settings");
    });

    it("should navigate to /workout/new when the new-workout button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(screen.getByTestId("status-header-new-button"));

      // Assert
      expect(location.history).toContain("/workout/new");
    });
  });

  describe("help dialog", () => {
    it("should not render the help dialog initially", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /help & documentation/i })
      ).not.toBeInTheDocument();
    });

    it("should open the help dialog when the help button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act
      await user.click(screen.getByRole("button", { name: /open help/i }));

      // Assert
      const headings = await screen.findAllByRole("heading", {
        name: /help & documentation/i,
      });
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should close the help dialog when the close button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act
      await user.click(screen.getByRole("button", { name: /open help/i }));
      const closeButtons = await screen.findAllByRole("button", {
        name: /close/i,
      });
      await user.click(closeButtons[0]);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /help & documentation/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should expose the StatusHeader as the navigation landmark", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("navigation", { name: /main navigation/i })
      ).toBeInTheDocument();
    });

    it("should NOT promote the brand label to an h1 (route owns the page heading)", () => {
      // Arrange

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /kaiord editor/i })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText(/kaiord editor/i)).toBeInTheDocument();
    });
  });
});
