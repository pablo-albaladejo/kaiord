import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../types/krd";
import { WorkoutMetadataEditor } from "./WorkoutMetadataEditor";

describe("WorkoutMetadataEditor", () => {
  const mockKrd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
      subSport: "indoor_cycling",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "cycling",
        subSport: "indoor_cycling",
        steps: [],
      },
    },
  };

  describe("rendering", () => {
    it("should render with workout metadata", () => {
      // Arrange & Act
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByLabelText("Workout name")).toHaveValue("Test Workout");
      expect(screen.getByLabelText("Sport type")).toHaveValue("cycling");
      expect(screen.getByLabelText("Sub-sport type")).toHaveValue(
        "indoor_cycling"
      );
    });

    it("should render with empty name when workout has no name", () => {
      // Arrange
      const krdWithoutName: KRD = {
        ...mockKrd,
        extensions: {
          structured_workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };

      // Act
      render(
        <WorkoutMetadataEditor
          krd={krdWithoutName}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByLabelText("Workout name")).toHaveValue("");
    });

    it("should render save and cancel buttons", () => {
      // Arrange & Act
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should update name when typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Act
      const nameInput = screen.getByLabelText("Workout name");
      await user.clear(nameInput);
      await user.type(nameInput, "New Workout Name");

      // Assert
      expect(nameInput).toHaveValue("New Workout Name");
    });

    it("should update sport when selecting", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Act
      const sportSelect = screen.getByLabelText("Sport type");
      await user.selectOptions(sportSelect, "running");

      // Assert
      expect(sportSelect).toHaveValue("running");
    });

    it("should reset sub-sport to generic when sport changes", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Act
      const sportSelect = screen.getByLabelText("Sport type");
      await user.selectOptions(sportSelect, "running");

      // Assert
      const subSportSelect = screen.getByLabelText("Sub-sport type");
      expect(subSportSelect).toHaveValue("generic");
    });

    it("should call onSave with updated KRD when save button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleSave = vi.fn();
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={handleSave}
          onCancel={vi.fn()}
        />
      );

      // Act
      const nameInput = screen.getByLabelText("Workout name");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Workout");

      const sportSelect = screen.getByLabelText("Sport type");
      await user.selectOptions(sportSelect, "running");

      const subSportSelect = screen.getByLabelText("Sub-sport type");
      await user.selectOptions(subSportSelect, "trail");

      await user.click(screen.getByRole("button", { name: /save/i }));

      // Assert
      expect(handleSave).toHaveBeenCalledOnce();
      const updatedKrd = handleSave.mock.calls[0][0];
      expect(updatedKrd.extensions?.structured_workout?.name).toBe(
        "Updated Workout"
      );
      expect(updatedKrd.extensions?.structured_workout?.sport).toBe("running");
      expect(updatedKrd.extensions?.structured_workout?.subSport).toBe("trail");
      expect(updatedKrd.metadata.sport).toBe("running");
      expect(updatedKrd.metadata.subSport).toBe("trail");
    });

    it("should call onCancel when cancel button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleCancel = vi.fn();
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={handleCancel}
        />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(handleCancel).toHaveBeenCalledOnce();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Arrange & Act
      render(
        <WorkoutMetadataEditor
          krd={mockKrd}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Assert
      expect(
        screen.getByRole("form", { name: /edit workout metadata/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Workout name")).toBeInTheDocument();
      expect(screen.getByLabelText("Sport type")).toBeInTheDocument();
      expect(screen.getByLabelText("Sub-sport type")).toBeInTheDocument();
    });
  });
});
