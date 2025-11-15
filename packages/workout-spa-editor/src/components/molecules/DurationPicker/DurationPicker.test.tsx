import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Duration } from "../../../types/krd";
import { DurationPicker } from "./DurationPicker";

describe("DurationPicker", () => {
  describe("Rendering", () => {
    it("should render duration type selector", () => {
      // Arrange
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("combobox", { name: /duration type/i })
      ).toBeInTheDocument();
    });

    it("should render time input when type is time", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = { type: "time", seconds: 300 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("spinbutton", { name: /duration \(seconds\)/i })
      ).toBeInTheDocument();
    });

    it("should render distance input when type is distance", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = { type: "distance", meters: 1000 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("spinbutton", { name: /distance \(meters\)/i })
      ).toBeInTheDocument();
    });

    it("should render open duration message when type is open", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = { type: "open" };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.getByText(/open-ended duration \(manual lap button\)/i)
      ).toBeInTheDocument();
    });
  });

  describe("Type Selection", () => {
    it("should call onChange with open duration when open is selected", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "open");

      // Assert
      expect(onChange).toHaveBeenCalledWith({ type: "open" });
    });

    it("should clear value when switching from time to distance", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: Duration = { type: "time", seconds: 300 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "distance");

      // Assert
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Value Input - Time", () => {
    it("should call onChange with valid time duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /duration \(seconds\)/i,
      });
      await user.clear(input);
      await user.type(input, "600");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "time",
        seconds: 600,
      });
    });

    it("should show validation error for negative time", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /duration \(seconds\)/i,
      });
      await user.clear(input);
      await user.type(input, "-10");

      // Assert
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("should show validation error for zero time", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /duration \(seconds\)/i,
      });
      await user.clear(input);
      await user.type(input, "0");

      // Assert
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
    });

    it("should show validation error for time exceeding 24 hours", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /duration \(seconds\)/i,
      });
      await user.clear(input);
      await user.type(input, "90000");

      // Assert
      expect(
        screen.getByText(/duration cannot exceed 24 hours/i)
      ).toBeInTheDocument();
    });
  });

  describe("Value Input - Distance", () => {
    it("should call onChange with valid distance duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: Duration = { type: "distance", meters: 0 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /distance \(meters\)/i,
      });
      await user.clear(input);
      await user.type(input, "5000");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "distance",
        meters: 5000,
      });
    });

    it("should show validation error for negative distance", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: Duration = { type: "distance", meters: 0 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /distance \(meters\)/i,
      });
      await user.clear(input);
      await user.type(input, "-100");

      // Assert
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
    });

    it("should show validation error for distance exceeding 1000 km", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: Duration = { type: "distance", meters: 0 };

      // Act
      render(<DurationPicker value={value} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", {
        name: /distance \(meters\)/i,
      });
      await user.clear(input);
      await user.type(input, "2000000");

      // Assert
      expect(
        screen.getByText(/distance cannot exceed 1000 km/i)
      ).toBeInTheDocument();
    });
  });

  describe("Error Display", () => {
    it("should display external error prop", () => {
      // Arrange
      const onChange = vi.fn();
      const error = "Custom error message";

      // Act
      render(<DurationPicker value={null} onChange={onChange} error={error} />);

      // Assert
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it("should prioritize external error over validation error", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const error = "External error";

      // Act
      render(<DurationPicker value={null} onChange={onChange} error={error} />);
      const input = screen.getByRole("spinbutton", {
        name: /duration \(seconds\)/i,
      });
      await user.clear(input);
      await user.type(input, "-10");

      // Assert
      expect(screen.getByText(error)).toBeInTheDocument();
      expect(
        screen.queryByText(/must be greater than 0/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable inputs when disabled prop is true", () => {
      // Arrange
      const onChange = vi.fn();

      // Act
      render(<DurationPicker value={null} onChange={onChange} disabled />);

      // Assert
      expect(
        screen.getByRole("combobox", { name: /duration type/i })
      ).toBeDisabled();
      expect(
        screen.getByRole("spinbutton", { name: /duration \(seconds\)/i })
      ).toBeDisabled();
    });
  });
});
