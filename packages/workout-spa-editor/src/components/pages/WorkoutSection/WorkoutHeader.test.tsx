import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkoutStore } from "../../../store/workout-store";
import type { KRD, Workout } from "../../../types/krd";
import { WorkoutHeader } from "./WorkoutHeader";

// Mock the child components
vi.mock("../../molecules/SaveButton/SaveButton", () => ({
  SaveButton: () => <div data-testid="save-button">Save Button</div>,
}));

vi.mock("../../molecules/SaveToLibraryButton/SaveToLibraryButton", () => ({
  SaveToLibraryButton: () => (
    <div data-testid="save-to-library-button">Save To Library Button</div>
  ),
}));

describe("WorkoutHeader", () => {
  const mockWorkout: Workout = {
    name: "Test Workout",
    sport: "cycling",
    subSport: "indoor_cycling",
    steps: [],
  };

  const mockKrd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
      subSport: "indoor_cycling",
    },
    extensions: {
      structured_workout: mockWorkout,
    },
  };

  beforeEach(() => {
    // Reset store state before each test
    useWorkoutStore.setState({
      currentWorkout: null,
      workoutHistory: [],
      historyIndex: -1,
      selectedStepId: null,
      isEditing: false,
    });
  });

  describe("rendering", () => {
    it("should render workout name and sport", () => {
      // Arrange & Act
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Assert
      expect(screen.getByText("Test Workout")).toBeInTheDocument();
      expect(
        screen.getByText(/Sport: cycling • indoor_cycling/i)
      ).toBeInTheDocument();
    });

    it("should render 'Untitled Workout' when name is not provided", () => {
      // Arrange
      const workoutWithoutName: Workout = {
        ...mockWorkout,
        name: undefined,
      };

      // Act
      render(<WorkoutHeader workout={workoutWithoutName} krd={mockKrd} />);

      // Assert
      expect(screen.getByText("Untitled Workout")).toBeInTheDocument();
    });

    it("should render sport without sub-sport when sub-sport is not provided", () => {
      // Arrange
      const workoutWithoutSubSport: Workout = {
        ...mockWorkout,
        subSport: undefined,
      };

      // Act
      render(<WorkoutHeader workout={workoutWithoutSubSport} krd={mockKrd} />);

      // Assert
      expect(screen.getByText(/^Sport: cycling$/)).toBeInTheDocument();
    });

    it("should render edit metadata button", () => {
      // Arrange & Act
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /edit workout metadata/i })
      ).toBeInTheDocument();
    });

    it("should render save and discard buttons", () => {
      // Arrange & Act
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Assert
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
      expect(screen.getByTestId("save-to-library-button")).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /discard workout and return to welcome screen/i,
        })
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should show metadata editor when edit button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /edit workout metadata/i })
      );

      // Assert
      expect(
        screen.getByRole("form", { name: /edit workout metadata/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Workout name")).toHaveValue("Test Workout");
    });

    it("should hide metadata editor when cancel is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /edit workout metadata/i })
      );
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(
        screen.queryByRole("form", { name: /edit workout metadata/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText("Test Workout")).toBeInTheDocument();
    });

    it("should update workout and hide editor when save is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      useWorkoutStore.setState({ currentWorkout: mockKrd });
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Act
      await user.click(
        screen.getByRole("button", { name: /edit workout metadata/i })
      );

      const nameInput = screen.getByLabelText("Workout name");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Workout");

      await user.click(screen.getByRole("button", { name: /save/i }));

      // Assert
      const state = useWorkoutStore.getState();
      expect(state.currentWorkout?.extensions?.structured_workout?.name).toBe(
        "Updated Workout"
      );
      expect(
        screen.queryByRole("form", { name: /edit workout metadata/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Arrange & Act
      render(<WorkoutHeader workout={mockWorkout} krd={mockKrd} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /edit workout metadata/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /discard workout and return to welcome screen/i,
        })
      ).toBeInTheDocument();
    });
  });
});
