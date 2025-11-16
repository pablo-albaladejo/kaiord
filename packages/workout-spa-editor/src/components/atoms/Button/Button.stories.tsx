import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Button visual style variant",
      control: { type: "select" },
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      description: "Button size",
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    disabled: {
      description: "Whether the button is disabled",
      control: { type: "boolean" },
    },
    loading: {
      description: "Whether the button is in loading state",
      control: { type: "boolean" },
    },
    onClick: {
      description: "Click handler",
      action: "clicked",
    },
    children: {
      description: "Button content",
      control: { type: "text" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary button
 */
export const Default: Story = {
  args: {
    children: "Button",
  },
};

/**
 * Primary variant (default)
 */
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

/**
 * Secondary variant
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

/**
 * Ghost variant (transparent background)
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

/**
 * Danger variant (destructive actions)
 */
export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Danger Button",
  },
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

/**
 * Medium size (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Button",
  },
};

/**
 * Large size
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: "Loading...",
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

/**
 * All sizes showcase
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * All states showcase
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};

/**
 * Real-world usage examples
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="primary">Save Workout</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          Copy
        </Button>
        <Button variant="ghost" size="sm">
          Paste
        </Button>
        <Button variant="ghost" size="sm">
          Duplicate
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="lg">
          Create New Workout
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="danger" size="sm">
          Delete Step
        </Button>
      </div>
    </div>
  ),
};
