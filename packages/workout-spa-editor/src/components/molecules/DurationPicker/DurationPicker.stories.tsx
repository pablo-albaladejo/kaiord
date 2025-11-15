import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { Duration } from "../../../types/krd";
import { DurationPicker } from "./DurationPicker";

const meta = {
  title: "Molecules/DurationPicker",
  component: DurationPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      description: "Current duration value",
      control: { type: "object" },
    },
    onChange: {
      description: "Callback when duration changes",
      action: "changed",
    },
    error: {
      description: "External error message",
      control: { type: "text" },
    },
    disabled: {
      description: "Whether the picker is disabled",
      control: { type: "boolean" },
    },
  },
} satisfies Meta<typeof DurationPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper component
const DurationPickerWrapper = ({
  initialValue,
  error,
  disabled,
}: {
  initialValue: Duration | null;
  error?: string;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState<Duration | null>(initialValue);

  return (
    <div className="w-96">
      <DurationPicker
        value={value}
        onChange={setValue}
        error={error}
        disabled={disabled}
      />
      <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p className="text-sm font-semibold mb-2">Current Value:</p>
        <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <DurationPickerWrapper initialValue={null} />,
};

export const WithTimeValue: Story = {
  render: () => (
    <DurationPickerWrapper initialValue={{ type: "time", seconds: 300 }} />
  ),
};

export const WithDistanceValue: Story = {
  render: () => (
    <DurationPickerWrapper initialValue={{ type: "distance", meters: 1000 }} />
  ),
};

export const WithOpenDuration: Story = {
  render: () => <DurationPickerWrapper initialValue={{ type: "open" }} />,
};

export const WithError: Story = {
  render: () => (
    <DurationPickerWrapper initialValue={null} error="Duration is required" />
  ),
};

export const Disabled: Story = {
  render: () => (
    <DurationPickerWrapper
      initialValue={{ type: "time", seconds: 600 }}
      disabled
    />
  ),
};
