import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormatDropdown } from "./FormatDropdown";
import type { FormatOption } from "./format-options";

const mockFormatOptions: FormatOption[] = [
  {
    value: "krd",
    label: "KRD",
    description: "Kaiord native format",
    compatibility: ["All platforms"],
  },
  {
    value: "fit",
    label: "FIT",
    description: "Garmin format",
    compatibility: ["Garmin"],
  },
  {
    value: "tcx",
    label: "TCX",
    description: "Training Center XML",
    compatibility: ["Garmin", "TrainingPeaks"],
  },
  {
    value: "zwo",
    label: "ZWO",
    description: "Zwift workout format",
    compatibility: ["Zwift"],
  },
];

describe("FormatDropdown - Property Tests", () => {
  describe("Property 2: Keyboard navigation cycles within bounds", () => {
    /**
     * Feature: workout-spa-editor/08-pr25-fixes, Property 2: Keyboard navigation cycles within bounds
     * Validates: Requirements 2.2, 2.3
     */
    it("should keep focus at last option when pressing ArrowDown at boundary", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      expect(screen.getByRole("menu")).toBeInTheDocument();

      // Act - Navigate to last option
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Try to go beyond last option
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Assert - Focus should stay at last option (index 3)
      const options = screen.getAllByRole("menuitem");
      expect(options[3]).toHaveAttribute("tabIndex", "0");
      expect(options[0]).toHaveAttribute("tabIndex", "-1");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
    });

    it("should keep focus at first option when pressing ArrowUp at boundary", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      expect(screen.getByRole("menu")).toBeInTheDocument();

      // Act - Try to go before first option
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowUp}");

      // Assert - Focus should stay at first option (index 0)
      const options = screen.getAllByRole("menuitem");
      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
      expect(options[3]).toHaveAttribute("tabIndex", "-1");
    });

    it("should cycle through all options with ArrowDown", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      const options = screen.getAllByRole("menuitem");

      // Act & Assert - Navigate through all options
      for (let i = 0; i < mockFormatOptions.length; i++) {
        // Current option should have tabIndex 0
        expect(options[i]).toHaveAttribute("tabIndex", "0");

        // All other options should have tabIndex -1
        for (let j = 0; j < mockFormatOptions.length; j++) {
          if (j !== i) {
            expect(options[j]).toHaveAttribute("tabIndex", "-1");
          }
        }

        // Move to next option (unless at last)
        if (i < mockFormatOptions.length - 1) {
          await user.keyboard("{ArrowDown}");
        }
      }
    });

    it("should cycle through all options with ArrowUp", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="zwo"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      const options = screen.getAllByRole("menuitem");

      // Act & Assert - Navigate backwards through all options
      for (let i = mockFormatOptions.length - 1; i >= 0; i--) {
        // Current option should have tabIndex 0
        expect(options[i]).toHaveAttribute("tabIndex", "0");

        // All other options should have tabIndex -1
        for (let j = 0; j < mockFormatOptions.length; j++) {
          if (j !== i) {
            expect(options[j]).toHaveAttribute("tabIndex", "-1");
          }
        }

        // Move to previous option (unless at first)
        if (i > 0) {
          await user.keyboard("{ArrowUp}");
        }
      }
    });
  });

  describe("Property 3: Keyboard selection matches mouse selection", () => {
    /**
     * Feature: workout-spa-editor/08-pr25-fixes, Property 3: Keyboard selection matches mouse selection
     * Validates: Requirements 2.4
     */
    it("should select same option with Enter as with mouse click", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      const { rerender } = render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act - Navigate to option 2 (TCX) and select with Enter
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Assert - Should have called onFormatSelect with "tcx"
      expect(onFormatSelect).toHaveBeenCalledWith("tcx");
      expect(onFormatSelect).toHaveBeenCalledTimes(1);

      // Reset mocks
      onFormatSelect.mockClear();
      onToggle.mockClear();

      // Rerender with dropdown open again
      rerender(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act - Click on option 2 (TCX) with mouse
      const tcxOption = screen.getByTestId("export-format-option-tcx");
      await user.click(tcxOption);

      // Assert - Should have called onFormatSelect with same value
      expect(onFormatSelect).toHaveBeenCalledWith("tcx");
      expect(onFormatSelect).toHaveBeenCalledTimes(1);
    });

    it("should select same option with Space as with mouse click", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      const { rerender } = render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act - Navigate to option 1 (FIT) and select with Space
      await user.keyboard("{ArrowDown}");
      await user.keyboard(" ");

      // Assert - Should have called onFormatSelect with "fit"
      expect(onFormatSelect).toHaveBeenCalledWith("fit");
      expect(onFormatSelect).toHaveBeenCalledTimes(1);

      // Reset mocks
      onFormatSelect.mockClear();
      onToggle.mockClear();

      // Rerender with dropdown open again
      rerender(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act - Click on option 1 (FIT) with mouse
      const fitOption = screen.getByTestId("export-format-option-fit");
      await user.click(fitOption);

      // Assert - Should have called onFormatSelect with same value
      expect(onFormatSelect).toHaveBeenCalledWith("fit");
      expect(onFormatSelect).toHaveBeenCalledTimes(1);
    });

    it("should close dropdown after keyboard selection like mouse selection", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act - Select with Enter
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Assert - Should have called onToggle to close dropdown
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});

describe("FormatDropdown - Unit Tests", () => {
  describe("keyboard navigation", () => {
    it("should navigate down with ArrowDown key", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      const options = screen.getAllByRole("menuitem");

      // Act
      await user.keyboard("{ArrowDown}");

      // Assert - Focus should move to second option
      expect(options[1]).toHaveAttribute("tabIndex", "0");
      expect(options[0]).toHaveAttribute("tabIndex", "-1");
    });

    it("should navigate up with ArrowUp key", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="fit"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      const options = screen.getAllByRole("menuitem");

      // Act
      await user.keyboard("{ArrowUp}");

      // Assert - Focus should move to first option
      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
    });

    it("should select option with Enter key", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Assert
      expect(onFormatSelect).toHaveBeenCalledWith("fit");
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should select option with Space key", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act
      await user.keyboard("{ArrowDown}");
      await user.keyboard(" ");

      // Assert
      expect(onFormatSelect).toHaveBeenCalledWith("fit");
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should close dropdown with Escape key", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act
      await user.keyboard("{Escape}");

      // Assert
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onFormatSelect).not.toHaveBeenCalled();
    });
  });

  describe("focus initialization", () => {
    it("should focus selected option when dropdown opens", () => {
      // Arrange
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="tcx"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Assert - TCX option (index 2) should be focused
      const options = screen.getAllByRole("menuitem");
      expect(options[2]).toHaveAttribute("tabIndex", "0");
      expect(options[0]).toHaveAttribute("tabIndex", "-1");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[3]).toHaveAttribute("tabIndex", "-1");
    });

    it("should focus first option when no option is selected", () => {
      // Arrange
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat={"unknown" as any}
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Assert - First option should be focused
      const options = screen.getAllByRole("menuitem");
      expect(options[0]).toHaveAttribute("tabIndex", "0");
      expect(options[1]).toHaveAttribute("tabIndex", "-1");
      expect(options[2]).toHaveAttribute("tabIndex", "-1");
      expect(options[3]).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("disabled state", () => {
    it("should not respond to keyboard events when disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={true}
        />
      );

      // Act - Try various keyboard interactions
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      await user.keyboard("{Escape}");

      // Assert - No callbacks should be triggered
      expect(onFormatSelect).not.toHaveBeenCalled();
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("should disable all option buttons when disabled", () => {
      // Arrange
      const onFormatSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FormatDropdown
          isOpen={true}
          currentFormat="krd"
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={true}
        />
      );

      // Assert - All options should be disabled
      const options = screen.getAllByRole("menuitem");
      options.forEach((option) => {
        expect(option).toBeDisabled();
      });
    });
  });
});
