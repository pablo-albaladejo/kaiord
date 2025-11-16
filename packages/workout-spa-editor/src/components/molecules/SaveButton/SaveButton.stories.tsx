import type { Meta, StoryObj } from "@storybook/react";
import type { KRD } from "../../../types/krd";
import { SaveButton } from "./SaveButton";

const meta = {
  title: "Molecules/SaveButton",
  component: SaveButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    workout: {
      description: "KRD workout object to save",
      control: { type: "object" },
    },
    disabled: {
      description: "Whether the button is disabled",
      control: { type: "boolean" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof SaveButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample valid workout
const validWorkout: KRD = {
  version: "1.0",
  type: "workout",
  metadata: {
    created: "2025-01-15T10:30:00Z",
    sport: "running",
  },
  extensions: {
    workout: {
      name: "Morning Run",
      sport: "running",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "open",
          target: { type: "open" },
          intensity: "warmup",
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 1200 },
          targetType: "heart_rate",
          target: {
            type: "heart_rate",
            value: { unit: "zone", value: 3 },
          },
          intensity: "active",
        },
      ],
    },
  },
};

// Sample invalid workout (missing required fields)
const invalidWorkout = {
  version: "1.0",
  type: "workout",
  // Missing metadata
  extensions: {
    workout: {
      name: "Invalid Workout",
      sport: "running",
      steps: [],
    },
  },
} as unknown as KRD;

/**
 * Default save button with valid workout
 */
export const Default: Story = {
  args: {
    workout: validWorkout,
  },
};

/**
 * Disabled save button
 */
export const Disabled: Story = {
  args: {
    workout: validWorkout,
    disabled: true,
  },
};

/**
 * Save button with invalid workout (will show error dialog)
 */
export const WithInvalidWorkout: Story = {
  args: {
    workout: invalidWorkout,
  },
};

/**
 * Save button with custom styling
 */
export const CustomStyling: Story = {
  args: {
    workout: validWorkout,
    className: "w-full",
  },
};

/**
 * Interactive example showing save flow
 */
export const Interactive: Story = {
  render: () => {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Click the button to save the workout. A file download will be
          triggered.
        </p>
        <SaveButton workout={validWorkout} />
      </div>
    );
  },
};
