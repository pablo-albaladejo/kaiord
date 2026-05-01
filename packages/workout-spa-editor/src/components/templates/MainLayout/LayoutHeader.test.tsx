/**
 * LayoutHeader Component Tests
 *
 * Tests for the main layout header including profile manager integration.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../../adapters/dexie/dexie-persistence-adapter";
import { addTemplate } from "../../../application/library/add-template";
import { createProfile } from "../../../application/profile/create-profile";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { LayoutHeader } from "./LayoutHeader";

function withRouter(ui: React.ReactNode, path = "/calendar") {
  const loc = memoryLocation({ path, record: true });
  return { ui: <Router hook={loc.hook}>{ui}</Router>, location: loc };
}

// Helper to create a minimal KRD for testing
const createTestKRD = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: new Date().toISOString(),
    sport: "running",
  },
  extensions: {
    structured_workout: {
      name: "Test Workout",
      sport: "running",
      steps: [],
    },
  },
});

describe("LayoutHeader", () => {
  // Reset state before each test. Profiles + templates are read via
  // useActiveProfileLive / useLibraryTemplatesLive against Dexie +
  // fake-indexeddb (D5.1). useWorkoutStore is the editor runtime
  // (legitimately Zustand-only).
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
    it("should render header with brand label", () => {
      // Arrange & Act — brand label is a `<span>` (not `<h1>`) since
      // each routed page owns its own primary heading marked with
      // `[data-route-heading]`. Assert by accessible name instead of
      // heading role.
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(screen.getByLabelText(/kaiord editor/i)).toBeInTheDocument();
    });

    it("should render navigation with profiles button", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      const nav = screen.getByRole("navigation", { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /open profile manager/i })
      ).toBeInTheDocument();
    });

    it("should render library button", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("button", { name: /open workout library/i })
      ).toBeInTheDocument();
    });

    it("should render theme toggle", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("button", { name: /switch to (light|dark) mode/i })
      ).toBeInTheDocument();
    });

    it("should render help button", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("button", { name: /open help/i })
      ).toBeInTheDocument();
    });

    it("should display help button with keyboard shortcut hint", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      const helpButton = screen.getByRole("button", { name: /open help/i });
      expect(helpButton).toHaveAttribute("title", "Help (?)");
    });
  });

  describe("profiles button", () => {
    it("should display 'Profiles' text when no active profile", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(screen.getByText(/^profiles$/i)).toBeInTheDocument();
    });

    it("should display active profile name when profile is active", async () => {
      // Arrange — first profile auto-sets active id (createProfile I1).
      const persistence = createDexiePersistence(db);
      await createProfile(persistence, "My Training Profile");

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        await screen.findByText(/my training profile/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/^profiles$/i)).not.toBeInTheDocument();
    });

    it("should open profile manager when clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /open profile manager/i })
      );

      // Assert
      expect(
        await screen.findByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();
    });
  });

  describe("profile manager dialog", () => {
    it("should not render profile manager initially", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /profile manager/i })
      ).not.toBeInTheDocument();
    });

    it("should close profile manager when close button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act - Open dialog
      await user.click(
        screen.getByRole("button", { name: /open profile manager/i })
      );
      expect(
        await screen.findByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();

      // Act - Close dialog
      await user.click(screen.getByRole("button", { name: /close/i }));

      // Assert
      expect(
        screen.queryByRole("heading", { name: /profile manager/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("help button", () => {
    it("should open help dialog when clicked", async () => {
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
      expect(headings[0]).toBeInTheDocument();
    });
  });

  describe("help dialog", () => {
    it("should not render help dialog initially", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /help & documentation/i })
      ).not.toBeInTheDocument();
    });

    it("should close help dialog when close button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act - Open dialog
      await user.click(screen.getByRole("button", { name: /open help/i }));
      const headings = await screen.findAllByRole("heading", {
        name: /help & documentation/i,
      });
      expect(headings.length).toBeGreaterThan(0);

      // Act - Close dialog
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      await user.click(closeButtons[0]);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /help & documentation/i })
      ).not.toBeInTheDocument();
    });

    it("should display help content when open", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act
      await user.click(screen.getByRole("button", { name: /open help/i }));

      // Assert
      expect(await screen.findByText(/getting started/i)).toBeInTheDocument();
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
      expect(
        screen.getByText(/frequently asked questions/i)
      ).toBeInTheDocument();
    });
  });

  describe("library button", () => {
    it("should not show badge when library is empty", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByLabelText(/workouts in library/i)
      ).not.toBeInTheDocument();
    });

    it("should show badge with count when library has workouts", async () => {
      // Arrange
      const persistence = createDexiePersistence(db);
      const krd = createTestKRD();
      await addTemplate(persistence, "Workout 1", "running", krd);
      await addTemplate(persistence, "Workout 2", "cycling", krd);

      // Act
      renderWithProviders(<LayoutHeader />, { persistence });

      // Assert
      expect(
        await screen.findByLabelText(/2 workouts in library/i)
      ).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should navigate to /library when clicked (no modal mounts)", async () => {
      // Arrange — Library is now a routed page per the SPA surface-
      // classification rule. The header click triggers navigation, not
      // a Radix Dialog.
      const user = userEvent.setup();
      const { ui, location } = withRouter(<LayoutHeader />);
      renderWithProviders(ui);

      // Act
      await user.click(
        screen.getByRole("button", { name: /open workout library/i })
      );

      // Assert
      expect(location.history).toContain("/library");
      expect(
        screen.queryByRole("heading", { name: /workout library/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("library dialog (deleted by surface-classification rule)", () => {
    it("never renders the WorkoutLibrary modal heading from the header", () => {
      // Arrange & Act — no header click should mount a Library modal.
      // The page surface owns the heading; the header owns navigation.
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /workout library/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("navigation", { name: /main navigation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /open profile manager/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /open workout library/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /open help/i })
      ).toBeInTheDocument();
    });

    it("should expose brand label without competing with route h1", () => {
      // Arrange & Act — the brand label MUST NOT be an `<h1>`, otherwise
      // each routed page would render two `<h1>`s and screen readers
      // would read both on every navigation. Heading-role assertions
      // about Kaiord Editor MUST go through the page heading, not the
      // header logo.
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /kaiord editor/i })
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText(/kaiord editor/i)).toBeInTheDocument();
    });

    it("should have accessible badge label when library has workouts", async () => {
      // Arrange
      const persistence = createDexiePersistence(db);
      const krd = createTestKRD();
      await addTemplate(persistence, "Workout 1", "running", krd);

      // Act
      renderWithProviders(<LayoutHeader />, { persistence });

      // Assert
      expect(
        await screen.findByLabelText(/^1 workout in library$/i)
      ).toBeInTheDocument();
    });
  });
});
