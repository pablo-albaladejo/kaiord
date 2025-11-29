import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SwimmingStepEditor } from "./SwimmingStepEditor";

describe("SwimmingStepEditor", () => {
  describe("rendering", () => {
    it("should render stroke type selector", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByLabelText(/stroke type/i)).toBeInTheDocument();
    });

    it("should render equipment selector", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      expect(screen.getByLabelText(/equipment/i)).toBeInTheDocument();
    });

    it("should display current stroke type value", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="butterfly"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/stroke type/i) as HTMLSelectElement;
      expect(select.value).toBe("butterfly");
    });

    it("should display current equipment value", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="swim_fins"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/equipment/i) as HTMLSelectElement;
      expect(select.value).toBe("swim_fins");
    });
  });

  describe("interactions", () => {
    it("should call onStrokeTypeChange when stroke type is changed", async () => {
      // Arrange
      const handleStrokeTypeChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={handleStrokeTypeChange}
          onEquipmentChange={vi.fn()}
        />
      );

      // Act
      const select = screen.getByLabelText(/stroke type/i);
      await user.selectOptions(select, "backstroke");

      // Assert
      expect(handleStrokeTypeChange).toHaveBeenCalledWith("backstroke");
    });

    it("should call onEquipmentChange when equipment is changed", async () => {
      // Arrange
      const handleEquipmentChange = vi.fn();
      const user = userEvent.setup();
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={handleEquipmentChange}
        />
      );

      // Act
      const select = screen.getByLabelText(/equipment/i);
      await user.selectOptions(select, "swim_kickboard");

      // Assert
      expect(handleEquipmentChange).toHaveBeenCalledWith("swim_kickboard");
    });
  });

  describe("stroke type options", () => {
    it("should display all available stroke types", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/stroke type/i);
      const options = Array.from(select.querySelectorAll("option")).map(
        (opt) => opt.value
      );

      expect(options).toContain("freestyle");
      expect(options).toContain("backstroke");
      expect(options).toContain("breaststroke");
      expect(options).toContain("butterfly");
      expect(options).toContain("drill");
      expect(options).toContain("mixed");
      expect(options).toContain("im");
    });
  });

  describe("equipment options", () => {
    it("should display all available equipment types", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/equipment/i);
      const options = Array.from(select.querySelectorAll("option")).map(
        (opt) => opt.value
      );

      expect(options).toContain("none");
      expect(options).toContain("swim_fins");
      expect(options).toContain("swim_kickboard");
      expect(options).toContain("swim_paddles");
      expect(options).toContain("swim_pull_buoy");
      expect(options).toContain("swim_snorkel");
    });
  });

  describe("accessibility", () => {
    it("should have proper labels for stroke type selector", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/stroke type/i);
      expect(select).toHaveAccessibleName();
    });

    it("should have proper labels for equipment selector", () => {
      // Arrange & Act
      render(
        <SwimmingStepEditor
          strokeType="freestyle"
          equipment="none"
          onStrokeTypeChange={vi.fn()}
          onEquipmentChange={vi.fn()}
        />
      );

      // Assert
      const select = screen.getByLabelText(/equipment/i);
      expect(select).toHaveAccessibleName();
    });
  });
});
