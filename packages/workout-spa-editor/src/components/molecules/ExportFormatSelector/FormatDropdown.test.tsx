import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import type { FormatOption } from "./format-options";
import { FormatDropdown } from "./FormatDropdown";

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

      // Act
      // Navigate to the last option, then try to go beyond it.
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Assert
      expect(screen.getByRole("menu")).toBeInTheDocument();
      // Focus should stay at the last option (index 3).
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

      // Act
      // Try to go before the first option.
      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowUp}");

      // Assert
      expect(screen.getByRole("menu")).toBeInTheDocument();
      // Focus should stay at the first option (index 0).
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

      // Act

      // Assert
      // Navigate through every option, asserting the roving tabindex
      // (focused option has tabIndex 0, the rest -1) at each step.
      for (let i = 0; i < mockFormatOptions.length; i++) {
        expect(options[i]).toHaveAttribute("tabIndex", "0");

        for (let j = 0; j < mockFormatOptions.length; j++) {
          if (j !== i) {
            expect(options[j]).toHaveAttribute("tabIndex", "-1");
          }
        }

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

      // Act

      // Assert
      // Navigate backwards through every option, asserting the roving
      // tabindex (focused option has tabIndex 0, the rest -1) at each step.
      for (let i = mockFormatOptions.length - 1; i >= 0; i--) {
        expect(options[i]).toHaveAttribute("tabIndex", "0");

        for (let j = 0; j < mockFormatOptions.length; j++) {
          if (j !== i) {
            expect(options[j]).toHaveAttribute("tabIndex", "-1");
          }
        }

        if (i > 0) {
          await user.keyboard("{ArrowUp}");
        }
      }
    });
  });

  describe("Property 3: Keyboard selection matches mouse selection", () => {
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

      // Act
      // Navigate to option 2 (TCX) and select it with Enter, then re-open
      // the dropdown and select the same option with a mouse click.
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      const keyboardSelection = [...onFormatSelect.mock.calls];

      onFormatSelect.mockClear();
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
      await user.click(screen.getByTestId("export-format-option-tcx"));
      const mouseSelection = [...onFormatSelect.mock.calls];

      // Assert
      expect(keyboardSelection).toEqual([["tcx"]]);
      expect(mouseSelection).toEqual([["tcx"]]);
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

      // Act
      // Navigate to option 1 (FIT) and select it with Space, then re-open
      // the dropdown and select the same option with a mouse click.
      await user.keyboard("{ArrowDown}");
      await user.keyboard(" ");
      const keyboardSelection = [...onFormatSelect.mock.calls];

      onFormatSelect.mockClear();
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
      await user.click(screen.getByTestId("export-format-option-fit"));
      const mouseSelection = [...onFormatSelect.mock.calls];

      // Assert
      expect(keyboardSelection).toEqual([["fit"]]);
      expect(mouseSelection).toEqual([["fit"]]);
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

      // Act
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      // Assert
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

      // Assert
      // Focus should move to the second option.
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

      // Assert
      // Focus should move to the first option.
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

      // Act
      const options = screen.getAllByRole("menuitem");

      // Assert
      // TCX option (index 2) should be focused.
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
          currentFormat={"unknown" as WorkoutFileFormat}
          formatOptions={mockFormatOptions}
          onToggle={onToggle}
          onFormatSelect={onFormatSelect}
          disabled={false}
        />
      );

      // Act
      const options = screen.getAllByRole("menuitem");

      // Assert
      // First option should be focused.
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

      // Act
      // Try various keyboard interactions while disabled.
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      await user.keyboard("{Escape}");

      // Assert
      // No callbacks should be triggered.
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

      // Act
      const options = screen.getAllByRole("menuitem");

      // Assert
      // All options should be disabled.
      options.forEach((option) => {
        expect(option).toBeDisabled();
      });
    });
  });
});
