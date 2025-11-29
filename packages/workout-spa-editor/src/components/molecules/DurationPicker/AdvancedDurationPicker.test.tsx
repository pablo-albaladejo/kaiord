import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Duration } from "../../../types/krd";
import { AdvancedDurationPicker } from "./AdvancedDurationPicker";

describe("AdvancedDurationPicker", () => {
  describe("Rendering", () => {
    it("should render duration type selector", () => {
      // Arrange
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("combobox", { name: /duration type/i })
      ).toBeInTheDocument();
    });

    it("should render value input for calories type", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = { type: "calories", calories: 500 };

      // Act
      render(<AdvancedDurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("spinbutton", { name: /calories/i })
      ).toBeInTheDocument();
    });

    it("should render repeat from input for repeat types", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = {
        type: "repeat_until_time",
        seconds: 600,
        repeatFrom: 0,
      };

      // Act
      render(<AdvancedDurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.getByRole("spinbutton", { name: /repeat from step/i })
      ).toBeInTheDocument();
    });

    it("should not render repeat from input for non-repeat types", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = { type: "calories", calories: 500 };

      // Act
      render(<AdvancedDurationPicker value={value} onChange={onChange} />);

      // Assert
      expect(
        screen.queryByRole("spinbutton", { name: /repeat from step/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Calorie-based Duration", () => {
    it("should call onChange with valid calorie duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", { name: /calories/i });
      await user.clear(input);
      await user.type(input, "500");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "calories",
        calories: 500,
      });
    });

    it("should show validation error for negative calories", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", { name: /calories/i });
      await user.clear(input);
      await user.type(input, "-100");

      // Assert
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument();
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("should show validation error for calories exceeding 10,000", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", { name: /calories/i });
      await user.clear(input);
      await user.type(input, "15000");

      // Assert
      expect(screen.getByText(/maximum 10000 calories/i)).toBeInTheDocument();
    });
  });

  describe("Power Threshold Duration", () => {
    it("should call onChange with power_less_than duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "power_less_than");
      const input = screen.getByRole("spinbutton", {
        name: /power \(watts\)/i,
      });
      await user.type(input, "200");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "power_less_than",
        watts: 200,
      });
    });

    it("should call onChange with power_greater_than duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "power_greater_than");
      const input = screen.getByRole("spinbutton", {
        name: /power \(watts\)/i,
      });
      await user.type(input, "250");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "power_greater_than",
        watts: 250,
      });
    });

    it("should show validation error for power exceeding 2,000 watts", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "power_less_than");
      const input = screen.getByRole("spinbutton", {
        name: /power \(watts\)/i,
      });
      await user.type(input, "3000");

      // Assert
      expect(screen.getByText(/maximum 2000 watts/i)).toBeInTheDocument();
    });
  });

  describe("Heart Rate Threshold Duration", () => {
    it("should call onChange with heart_rate_less_than duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "heart_rate_less_than");
      const input = screen.getByRole("spinbutton", {
        name: /heart rate \(bpm\)/i,
      });
      await user.type(input, "140");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "heart_rate_less_than",
        bpm: 140,
      });
    });

    it("should show validation error for heart rate exceeding 220 bpm", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "heart_rate_less_than");
      const input = screen.getByRole("spinbutton", {
        name: /heart rate \(bpm\)/i,
      });
      await user.type(input, "250");

      // Assert
      expect(screen.getByText(/maximum 220 bpm/i)).toBeInTheDocument();
    });
  });

  describe("Repeat Until Conditions", () => {
    it("should call onChange with repeat_until_time duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_time");
      const valueInput = screen.getByRole("spinbutton", {
        name: /time \(seconds\)/i,
      });
      await user.type(valueInput, "600");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "2");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "repeat_until_time",
        seconds: 600,
        repeatFrom: 2,
      });
    });

    it("should call onChange with repeat_until_distance duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_distance");
      const valueInput = screen.getByRole("spinbutton", {
        name: /distance \(meters\)/i,
      });
      await user.type(valueInput, "5000");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "1");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "repeat_until_distance",
        meters: 5000,
        repeatFrom: 1,
      });
    });

    it("should call onChange with repeat_until_calories duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_calories");
      const valueInput = screen.getByRole("spinbutton", { name: /calories/i });
      await user.type(valueInput, "1000");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "0");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "repeat_until_calories",
        calories: 1000,
        repeatFrom: 0,
      });
    });

    it("should call onChange with repeat_until_heart_rate_greater_than duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_heart_rate_greater_than");
      const valueInput = screen.getByRole("spinbutton", {
        name: /heart rate \(bpm\)/i,
      });
      await user.type(valueInput, "160");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "3");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "repeat_until_heart_rate_greater_than",
        bpm: 160,
        repeatFrom: 3,
      });
    });

    it("should call onChange with repeat_until_power_less_than duration", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_power_less_than");
      const valueInput = screen.getByRole("spinbutton", {
        name: /power \(watts\)/i,
      });
      await user.type(valueInput, "180");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "1");

      // Assert
      expect(onChange).toHaveBeenLastCalledWith({
        type: "repeat_until_power_less_than",
        watts: 180,
        repeatFrom: 1,
      });
    });

    it("should show validation error for negative repeat from value", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_time");
      const valueInput = screen.getByRole("spinbutton", {
        name: /time \(seconds\)/i,
      });
      await user.type(valueInput, "600");
      const repeatInput = screen.getByRole("spinbutton", {
        name: /repeat from step/i,
      });
      await user.clear(repeatInput);
      await user.type(repeatInput, "-1");

      // Assert
      expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument();
    });
  });

  describe("Type Switching", () => {
    it("should clear value when switching types", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const value: Duration = { type: "calories", calories: 500 };

      // Act
      render(<AdvancedDurationPicker value={value} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "power_less_than");

      // Assert
      expect(onChange).toHaveBeenCalledWith(null);
      const input = screen.getByRole("spinbutton", {
        name: /power \(watts\)/i,
      });
      expect(input).toHaveValue(null);
    });
  });

  describe("Error Display", () => {
    it("should display external error prop", () => {
      // Arrange
      const onChange = vi.fn();
      const error = "Custom error message";

      // Act
      render(
        <AdvancedDurationPicker
          value={null}
          onChange={onChange}
          error={error}
        />
      );

      // Assert
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it("should prioritize external error over validation error", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();
      const error = "External error";

      // Act
      render(
        <AdvancedDurationPicker
          value={null}
          onChange={onChange}
          error={error}
        />
      );
      const input = screen.getByRole("spinbutton", { name: /calories/i });
      await user.clear(input);
      await user.type(input, "-100");

      // Assert
      expect(screen.getByText(error)).toBeInTheDocument();
      expect(
        screen.queryByText(/must be greater than 0/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should disable all inputs when disabled prop is true", () => {
      // Arrange
      const onChange = vi.fn();

      // Act
      render(
        <AdvancedDurationPicker value={null} onChange={onChange} disabled />
      );

      // Assert
      expect(
        screen.getByRole("combobox", { name: /duration type/i })
      ).toBeDisabled();
      expect(
        screen.getByRole("spinbutton", { name: /calories/i })
      ).toBeDisabled();
    });

    it("should disable repeat from input when disabled", () => {
      // Arrange
      const onChange = vi.fn();
      const value: Duration = {
        type: "repeat_until_time",
        seconds: 600,
        repeatFrom: 0,
      };

      // Act
      render(
        <AdvancedDurationPicker value={value} onChange={onChange} disabled />
      );

      // Assert
      expect(
        screen.getByRole("spinbutton", { name: /repeat from step/i })
      ).toBeDisabled();
    });
  });

  describe("Validation Edge Cases", () => {
    it("should handle empty input", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const input = screen.getByRole("spinbutton", { name: /calories/i });
      await user.clear(input);
      await user.type(input, "100");
      await user.clear(input);

      // Assert
      // Empty input should call onChange with null
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it("should validate time not exceeding 24 hours for repeat_until_time", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_time");
      const input = screen.getByRole("spinbutton", {
        name: /time \(seconds\)/i,
      });
      await user.type(input, "90000");

      // Assert
      expect(screen.getByText(/maximum 24 hours/i)).toBeInTheDocument();
    });

    it("should validate distance not exceeding 1,000 km for repeat_until_distance", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChange = vi.fn();

      // Act
      render(<AdvancedDurationPicker value={null} onChange={onChange} />);
      const select = screen.getByRole("combobox", { name: /duration type/i });
      await user.selectOptions(select, "repeat_until_distance");
      const input = screen.getByRole("spinbutton", {
        name: /distance \(meters\)/i,
      });
      await user.type(input, "2000000");

      // Assert
      expect(screen.getByText(/maximum 1000 km/i)).toBeInTheDocument();
    });
  });
});
