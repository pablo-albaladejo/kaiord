import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta = {
  title: "Atoms/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["text", "number", "select"],
      description: "The type of input to render",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the input",
    },
    label: {
      control: "text",
      description: "Label text for the input",
    },
    helperText: {
      control: "text",
      description: "Helper text displayed below the input",
    },
    error: {
      control: "text",
      description: "Error message to display",
    },
    disabled: {
      control: "boolean",
      description: "Whether the input is disabled",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextDefault: Story = {
  args: {
    variant: "text",
    placeholder: "Enter text...",
  },
};

export const TextWithLabel: Story = {
  args: {
    variant: "text",
    label: "Username",
    placeholder: "Enter your username",
  },
};

export const TextWithHelperText: Story = {
  args: {
    variant: "text",
    label: "Email",
    placeholder: "you@example.com",
    helperText: "We'll never share your email with anyone else.",
  },
};

export const TextWithError: Story = {
  args: {
    variant: "text",
    label: "Email",
    placeholder: "you@example.com",
    error: "Please enter a valid email address",
  },
};

export const TextDisabled: Story = {
  args: {
    variant: "text",
    label: "Username",
    placeholder: "Enter your username",
    disabled: true,
  },
};

export const NumberDefault: Story = {
  args: {
    variant: "number",
    placeholder: "Enter number...",
  },
};

export const NumberWithLabel: Story = {
  args: {
    variant: "number",
    label: "Age",
    placeholder: "Enter your age",
    min: 0,
    max: 120,
  },
};

export const NumberWithHelperText: Story = {
  args: {
    variant: "number",
    label: "Power (watts)",
    placeholder: "250",
    helperText: "Enter your target power in watts",
    min: 0,
    max: 1000,
    step: 5,
  },
};

export const NumberWithError: Story = {
  args: {
    variant: "number",
    label: "Heart Rate",
    placeholder: "150",
    error: "Heart rate must be between 40 and 220 bpm",
    min: 40,
    max: 220,
  },
};

export const SelectDefault: Story = {
  args: {
    variant: "select",
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ],
  },
};

export const SelectWithLabel: Story = {
  args: {
    variant: "select",
    label: "Sport",
    options: [
      { value: "cycling", label: "Cycling" },
      { value: "running", label: "Running" },
      { value: "swimming", label: "Swimming" },
    ],
  },
};

export const SelectWithHelperText: Story = {
  args: {
    variant: "select",
    label: "Target Type",
    helperText: "Select the type of target for this workout step",
    options: [
      { value: "power", label: "Power" },
      { value: "heart_rate", label: "Heart Rate" },
      { value: "pace", label: "Pace" },
      { value: "cadence", label: "Cadence" },
      { value: "open", label: "Open" },
    ],
  },
};

export const SelectWithError: Story = {
  args: {
    variant: "select",
    label: "Intensity",
    error: "Please select an intensity level",
    options: [
      { value: "warmup", label: "Warmup" },
      { value: "active", label: "Active" },
      { value: "cooldown", label: "Cooldown" },
      { value: "rest", label: "Rest" },
    ],
  },
};

export const SelectDisabled: Story = {
  args: {
    variant: "select",
    label: "Sport",
    disabled: true,
    options: [
      { value: "cycling", label: "Cycling" },
      { value: "running", label: "Running" },
    ],
  },
};

export const SmallSize: Story = {
  args: {
    variant: "text",
    size: "sm",
    label: "Small Input",
    placeholder: "Small size",
  },
};

export const MediumSize: Story = {
  args: {
    variant: "text",
    size: "md",
    label: "Medium Input",
    placeholder: "Medium size (default)",
  },
};

export const LargeSize: Story = {
  args: {
    variant: "text",
    size: "lg",
    label: "Large Input",
    placeholder: "Large size",
  },
};

export const CompleteForm: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Input
        variant="text"
        label="Workout Name"
        placeholder="Morning Intervals"
        helperText="Give your workout a descriptive name"
      />
      <Input
        variant="select"
        label="Sport"
        options={[
          { value: "cycling", label: "Cycling" },
          { value: "running", label: "Running" },
          { value: "swimming", label: "Swimming" },
        ]}
      />
      <Input
        variant="number"
        label="Duration (minutes)"
        placeholder="60"
        min={1}
        max={300}
        helperText="Total workout duration"
      />
      <Input
        variant="number"
        label="Target Power (watts)"
        placeholder="250"
        error="Power must be between 50 and 500 watts"
        min={50}
        max={500}
      />
    </div>
  ),
};
