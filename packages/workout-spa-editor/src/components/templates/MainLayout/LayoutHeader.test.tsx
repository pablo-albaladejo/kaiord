/**
 * LayoutHeader Component Tests
 *
 * Tests for the main layout header including profile manager integration.
 */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibraryStore } from "../../../store/library-store";
import { useProfileStore } from "../../../store/profile-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { renderWithProviders } from "../../../test-utils";
import type { KRD } from "../../../types/krd";
import { LayoutHeader } from "./LayoutHeader";

// Helper to create a minimal KRD for testing
const createTestKRD = (): KRD => ({
  version: "1.0",
  type: "workout",
  metadata: {
    created: new Date().toISOString(),
    sport: "running",
  },
  extensions: {
    workout: {
      name: "Test Workout",
      sport: "running",
      steps: [],
    },
  },
});

describe("LayoutHeader", () => {
  // Reset store state before each test
  beforeEach(() => {
    useProfileStore.setState({
      profiles: [],
      activeProfileId: null,
    });
    useLibraryStore.setState({
      templates: [],
    });
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      selectedStepIds: [],
      isEditing: false,
    });
  });

  describe("rendering", () => {
    it("should render header with title", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /workout editor/i })
      ).toBeInTheDocument();
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

    it("should display active profile name when profile is active", () => {
      // Arrange
      const { createProfile, setActiveProfile } = useProfileStore.getState();
      const profile = createProfile("My Training Profile");
      setActiveProfile(profile.id);

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(screen.getByText(/my training profile/i)).toBeInTheDocument();
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
        screen.getByRole("heading", { name: /profile manager/i })
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
        screen.getByRole("heading", { name: /profile manager/i })
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
      const headings = screen.getAllByRole("heading", {
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
      const headings = screen.getAllByRole("heading", {
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
      expect(screen.getByText(/getting started/i)).toBeInTheDocument();
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

    it("should show badge with count when library has workouts", () => {
      // Arrange
      const { addTemplate } = useLibraryStore.getState();
      const krd = createTestKRD();
      addTemplate("Workout 1", "running", krd);
      addTemplate("Workout 2", "cycling", krd);

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByLabelText(/2 workouts in library/i)
      ).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should open library dialog when clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /open workout library/i })
      );

      // Assert
      expect(
        screen.getByRole("heading", { name: /workout library/i })
      ).toBeInTheDocument();
    });
  });

  describe("library dialog", () => {
    it("should not render library dialog initially", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /workout library/i })
      ).not.toBeInTheDocument();
    });

    it("should close library dialog when close button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(<LayoutHeader />);

      // Act - Open dialog
      await user.click(
        screen.getByRole("button", { name: /open workout library/i })
      );
      expect(
        screen.getByRole("heading", { name: /workout library/i })
      ).toBeInTheDocument();

      // Act - Close dialog
      const closeButtons = screen.getAllByRole("button", { name: /close/i });
      await user.click(closeButtons[0]);

      // Assert
      expect(
        screen.queryByRole("heading", { name: /workout library/i })
      ).not.toBeInTheDocument();
    });

    it("should load workout from library when selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const { addTemplate } = useLibraryStore.getState();
      const krd = createTestKRD();
      addTemplate("Test Workout", "running", krd);

      renderWithProviders(<LayoutHeader />);

      // Act - Open library
      await user.click(
        screen.getByRole("button", { name: /open workout library/i })
      );

      // Act - Load workout
      const loadButton = screen.getByRole("button", { name: /^load$/i });
      await user.click(loadButton);

      // Assert - Workout should be loaded
      const { currentWorkout } = useWorkoutStore.getState();
      expect(currentWorkout).toEqual(krd);
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

    it("should have proper heading hierarchy", () => {
      // Arrange & Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      const heading = screen.getByRole("heading", { name: /workout editor/i });
      expect(heading.tagName).toBe("H1");
    });

    it("should have accessible badge label when library has workouts", () => {
      // Arrange
      const { addTemplate } = useLibraryStore.getState();
      const krd = createTestKRD();
      addTemplate("Workout 1", "running", krd);

      // Act
      renderWithProviders(<LayoutHeader />);

      // Assert
      expect(
        screen.getByLabelText(/1 workouts in library/i)
      ).toBeInTheDocument();
    });
  });
});
