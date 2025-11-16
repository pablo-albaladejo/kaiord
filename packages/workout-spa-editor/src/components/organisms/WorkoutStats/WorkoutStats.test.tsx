import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RepetitionBlock, Workout, WorkoutStep } from "../../../types/krd";
import { WorkoutStats } from "./WorkoutStats";

describe("WorkoutStats", () => {
  const createMockStep = (
    stepIndex: number,
    duration: { type: string; seconds?: number; meters?: number }
  ): WorkoutStep => ({
    stepIndex,
    durationType: duration.type as "time" | "distance" | "open",
    duration: duration as WorkoutStep["duration"],
    targetType: "power",
    target: {
      type: "power",
      value: { unit: "watts", value: 200 },
    },
    intensity: "active",
  });

  const createMockWorkout = (
    steps: Array<WorkoutStep | RepetitionBlock>
  ): Workout => ({
    name: "Test Workout",
    sport: "cycling",
    steps,
  });

  describe("rendering", () => {
    it("should render workout stats heading", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Workout Stats")).toBeInTheDocument();
    });

    it("should not render when workout is null", () => {
      // Arrange & Act
      const { container } = render(<WorkoutStats workout={null} />);

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should apply custom className", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
      ]);

      // Act
      const { container } = render(
        <WorkoutStats workout={workout} className="custom-class" />
      );

      // Assert
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should have proper ARIA role", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(
        screen.getByRole("region", { name: "Workout statistics" })
      ).toBeInTheDocument();
    });
  });

  describe("duration statistics", () => {
    it("should display total duration for time-based steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }), // 5 min
        createMockStep(1, { type: "time", seconds: 600 }), // 10 min
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Total Duration:")).toBeInTheDocument();
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });

    it("should format duration in hours and minutes for long workouts", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 3600 }), // 1 hour
        createMockStep(1, { type: "time", seconds: 1800 }), // 30 min
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("1:30:00")).toBeInTheDocument();
    });

    it("should show estimate indicator for open-ended steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
        createMockStep(1, { type: "open" }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText(/estimate/i)).toBeInTheDocument();
    });
  });

  describe("distance statistics", () => {
    it("should display total distance for distance-based steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "distance", meters: 5000 }), // 5 km
        createMockStep(1, { type: "distance", meters: 3000 }), // 3 km
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Total Distance:")).toBeInTheDocument();
      expect(screen.getByText("8.00 km")).toBeInTheDocument();
    });

    it("should format distance in meters for short distances", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "distance", meters: 500 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("500 m")).toBeInTheDocument();
    });

    it("should display placeholder when no distance-based steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Total Distance:")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("step count statistics", () => {
    it("should display total step count", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
        createMockStep(1, { type: "time", seconds: 600 }),
        createMockStep(2, { type: "time", seconds: 300 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Total Steps:")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should count steps within repetition blocks", () => {
      // Arrange
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          createMockStep(0, { type: "time", seconds: 300 }),
          createMockStep(1, { type: "time", seconds: 600 }),
        ],
      };
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
        repetitionBlock,
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // 1 regular step + (2 steps * 3 repeats) = 7 total steps
      expect(screen.getByText("Total Steps:")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
    });
  });

  describe("repetition block statistics", () => {
    it("should calculate duration including repetitions", () => {
      // Arrange
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 3,
        steps: [
          createMockStep(0, { type: "time", seconds: 300 }), // 5 min
          createMockStep(1, { type: "time", seconds: 300 }), // 5 min
        ],
      };
      const workout = createMockWorkout([repetitionBlock]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // (5 min + 5 min) * 3 = 30 min
      expect(screen.getByText("30:00")).toBeInTheDocument();
    });

    it("should calculate distance including repetitions", () => {
      // Arrange
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 2,
        steps: [
          createMockStep(0, { type: "distance", meters: 1000 }), // 1 km
          createMockStep(1, { type: "distance", meters: 500 }), // 0.5 km
        ],
      };
      const workout = createMockWorkout([repetitionBlock]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // (1 km + 0.5 km) * 2 = 3 km
      expect(screen.getByText("3.00 km")).toBeInTheDocument();
    });

    it("should handle mixed steps and repetition blocks", () => {
      // Arrange
      const repetitionBlock: RepetitionBlock = {
        repeatCount: 2,
        steps: [createMockStep(1, { type: "time", seconds: 300 })], // 5 min
      };
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 600 }), // 10 min
        repetitionBlock, // 5 min * 2 = 10 min
        createMockStep(2, { type: "time", seconds: 300 }), // 5 min
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // 10 + 10 + 5 = 25 min
      expect(screen.getByText("25:00")).toBeInTheDocument();
    });
  });

  describe("mixed duration types", () => {
    it("should handle workout with both time and distance steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 600 }), // 10 min
        createMockStep(1, { type: "distance", meters: 5000 }), // 5 km
        createMockStep(2, { type: "time", seconds: 300 }), // 5 min
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // When mixing time and distance steps, neither can be calculated precisely
      expect(screen.getByText("Total Duration:")).toBeInTheDocument();
      expect(screen.getByText("Total Distance:")).toBeInTheDocument();
      expect(screen.getAllByText("—")).toHaveLength(2); // Both duration and distance show placeholders
    });

    it("should handle workout with open-ended steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
        createMockStep(1, { type: "open" }),
        createMockStep(2, { type: "time", seconds: 300 }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      // When there are open-ended steps, duration cannot be calculated
      expect(screen.getAllByText("—")).toHaveLength(2); // Duration and Distance both show placeholder
      expect(screen.getByText(/estimate/i)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle empty workout", () => {
      // Arrange
      const workout = createMockWorkout([]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Workout Stats")).toBeInTheDocument();
      expect(screen.getByText("Total Steps:")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle workout with only open-ended steps", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "open" }),
        createMockStep(1, { type: "open" }),
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("Total Steps:")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("should handle very large durations", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 7200 }), // 2 hours
        createMockStep(1, { type: "time", seconds: 5400 }), // 1.5 hours
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("3:30:00")).toBeInTheDocument();
    });

    it("should handle very large distances", () => {
      // Arrange
      const workout = createMockWorkout([
        createMockStep(0, { type: "distance", meters: 50000 }), // 50 km
        createMockStep(1, { type: "distance", meters: 30000 }), // 30 km
      ]);

      // Act
      render(<WorkoutStats workout={workout} />);

      // Assert
      expect(screen.getByText("80.00 km")).toBeInTheDocument();
    });
  });

  describe("real-time updates", () => {
    it("should recalculate stats when workout changes", () => {
      // Arrange
      const workout1 = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
      ]);

      const { rerender } = render(<WorkoutStats workout={workout1} />);
      expect(screen.getByText("5:00")).toBeInTheDocument();

      // Act - Update workout
      const workout2 = createMockWorkout([
        createMockStep(0, { type: "time", seconds: 300 }),
        createMockStep(1, { type: "time", seconds: 600 }),
      ]);
      rerender(<WorkoutStats workout={workout2} />);

      // Assert
      expect(screen.getByText("15:00")).toBeInTheDocument();
    });
  });
});
