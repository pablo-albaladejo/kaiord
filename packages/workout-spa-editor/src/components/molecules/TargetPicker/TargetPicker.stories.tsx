import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { Target } from "../../../types/krd";
import { TargetPicker } from "./TargetPicker";

const meta: Meta<typeof TargetPicker> = {
  title: "Molecules/TargetPicker",
  component: TargetPicker,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof TargetPicker>;

const TargetPickerWithState = (args: { initialValue: Target | null }) => {
  const [value, setValue] = useState<Target | null>(args.initialValue);

  return (
    <div className="max-w-md">
      <TargetPicker value={value} onChange={setValue} />
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-sm font-semibold mb-2">Current Value:</p>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <TargetPickerWithState initialValue={null} />,
};

export const PowerWatts: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "power",
        value: { unit: "watts", value: 250 },
      }}
    />
  ),
};

export const PowerPercentFTP: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "power",
        value: { unit: "percent_ftp", value: 85 },
      }}
    />
  ),
};

export const PowerZone: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "power",
        value: { unit: "zone", value: 4 },
      }}
    />
  ),
};

export const PowerRange: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "power",
        value: { unit: "range", min: 200, max: 250 },
      }}
    />
  ),
};

export const HeartRateBPM: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "heart_rate",
        value: { unit: "bpm", value: 150 },
      }}
    />
  ),
};

export const HeartRateZone: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "heart_rate",
        value: { unit: "zone", value: 3 },
      }}
    />
  ),
};

export const HeartRatePercentMax: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "heart_rate",
        value: { unit: "percent_max", value: 85 },
      }}
    />
  ),
};

export const HeartRateRange: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "heart_rate",
        value: { unit: "range", min: 140, max: 160 },
      }}
    />
  ),
};

export const PaceMPS: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "pace",
        value: { unit: "mps", value: 3.5 },
      }}
    />
  ),
};

export const PaceZone: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "pace",
        value: { unit: "zone", value: 2 },
      }}
    />
  ),
};

export const PaceRange: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "pace",
        value: { unit: "range", min: 3.0, max: 4.0 },
      }}
    />
  ),
};

export const CadenceRPM: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "cadence",
        value: { unit: "rpm", value: 90 },
      }}
    />
  ),
};

export const CadenceRange: Story = {
  render: () => (
    <TargetPickerWithState
      initialValue={{
        type: "cadence",
        value: { unit: "range", min: 85, max: 95 },
      }}
    />
  ),
};

export const OpenTarget: Story = {
  render: () => <TargetPickerWithState initialValue={{ type: "open" }} />,
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<Target | null>({
      type: "power",
      value: { unit: "watts", value: 250 },
    });

    return (
      <div className="max-w-md">
        <TargetPicker
          value={value}
          onChange={setValue}
          error="This is an external error message"
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value] = useState<Target | null>({
      type: "power",
      value: { unit: "watts", value: 250 },
    });

    return (
      <div className="max-w-md">
        <TargetPicker value={value} onChange={() => {}} disabled={true} />
      </div>
    );
  },
};
