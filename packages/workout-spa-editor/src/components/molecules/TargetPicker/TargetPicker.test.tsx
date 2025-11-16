import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Target } from "../../../types/krd";
import { TargetPicker } from "./TargetPicker";

describe("TargetPicker", () => {
  it("should render with open target by default", () => {
    const onChange = vi.fn();

    render(<TargetPicker value={null} onChange={onChange} />);

    expect(screen.getByLabelText("Select target type")).toBeInTheDocument();
    expect(
      screen.getByText("Open target (no specific intensity goal)")
    ).toBeInTheDocument();
  });

  it("should render power target with watts unit", () => {
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    expect(screen.getByLabelText("Select target type")).toHaveValue("power");
    expect(screen.getByLabelText("Select target unit")).toHaveValue("watts");
    expect(screen.getByLabelText("Power (watts)")).toHaveValue(250);
  });

  it("should render heart rate target with zone unit", () => {
    const onChange = vi.fn();
    const value: Target = {
      type: "heart_rate",
      value: { unit: "zone", value: 3 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    expect(screen.getByLabelText("Select target type")).toHaveValue(
      "heart_rate"
    );
    expect(screen.getByLabelText("Select target unit")).toHaveValue("zone");
    expect(screen.getByLabelText("HR Zone (1-5)")).toHaveValue(3);
  });

  it("should render range inputs for range unit", () => {
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "range", min: 200, max: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    expect(screen.getByLabelText("Minimum value")).toHaveValue(200);
    expect(screen.getByLabelText("Maximum value")).toHaveValue(250);
  });

  it("should call onChange when target type changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TargetPicker value={null} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");
    await user.selectOptions(typeSelect, "power");

    expect(onChange).toHaveBeenCalled();
  });

  it("should validate power zone range (1-7)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "zone", value: 1 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("Power Zone (1-7)");
    await user.clear(input);
    await user.type(input, "8");

    expect(
      screen.getByText("Power zone must be between 1 and 7")
    ).toBeInTheDocument();
  });

  it("should validate heart rate zone range (1-5)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "heart_rate",
      value: { unit: "zone", value: 1 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("HR Zone (1-5)");
    await user.clear(input);
    await user.type(input, "6");

    expect(
      screen.getByText("Heart rate zone must be between 1 and 5")
    ).toBeInTheDocument();
  });

  it("should validate negative values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const input = screen.getByLabelText("Power (watts)");
    await user.clear(input);
    await user.type(input, "-10");

    expect(screen.getByText("Must be greater than 0")).toBeInTheDocument();
  });

  it("should validate range min < max", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "range", min: 200, max: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const minInput = screen.getByLabelText("Minimum value");
    await user.clear(minInput);
    await user.type(minInput, "300");

    expect(
      screen.getByText("Minimum must be less than maximum")
    ).toBeInTheDocument();
  });

  it("should display external error message", () => {
    const onChange = vi.fn();

    render(
      <TargetPicker
        value={null}
        onChange={onChange}
        error="External error message"
      />
    );

    expect(screen.getByText("External error message")).toBeInTheDocument();
  });

  it("should disable all inputs when disabled prop is true", () => {
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} disabled={true} />);

    expect(screen.getByLabelText("Select target type")).toBeDisabled();
    expect(screen.getByLabelText("Select target unit")).toBeDisabled();
    expect(screen.getByLabelText("Power (watts)")).toBeDisabled();
  });

  it("should show appropriate unit options for each target type", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TargetPicker value={null} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");

    // Power
    await user.selectOptions(typeSelect, "power");
    const unitSelect = screen.getByLabelText("Select target unit");
    expect(unitSelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Watts" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "% FTP" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Power Zone" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Range" })).toBeInTheDocument();
  });

  it("should clear values when changing target type", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const value: Target = {
      type: "power",
      value: { unit: "watts", value: 250 },
    };

    render(<TargetPicker value={value} onChange={onChange} />);

    const typeSelect = screen.getByLabelText("Select target type");
    await user.selectOptions(typeSelect, "heart_rate");

    // Value should be cleared
    const input = screen.getByLabelText("Heart Rate (BPM)");
    expect(input).toHaveValue(null);
  });
});
