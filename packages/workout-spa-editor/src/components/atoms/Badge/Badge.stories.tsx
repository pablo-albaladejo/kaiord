import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Badge color variant",
      control: { type: "select" },
      options: [
        "warmup",
        "active",
        "cooldown",
        "rest",
        "recovery",
        "interval",
        "power",
        "heart_rate",
        "cadence",
        "pace",
        "stroke_type",
        "open",
        "other",
      ],
    },
    size: {
      description: "Badge size",
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
    icon: {
      description: "Optional icon element",
      control: { type: "text" },
    },
    children: {
      description: "Badge content",
      control: { type: "text" },
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge
 */
export const Default: Story = {
  args: {
    children: "Badge",
  },
};

/**
 * Warmup intensity variant
 */
export const Warmup: Story = {
  args: {
    variant: "warmup",
    children: "Warmup",
  },
};

/**
 * Active intensity variant
 */
export const Active: Story = {
  args: {
    variant: "active",
    children: "Active",
  },
};

/**
 * Cooldown intensity variant
 */
export const Cooldown: Story = {
  args: {
    variant: "cooldown",
    children: "Cooldown",
  },
};

/**
 * Rest intensity variant
 */
export const Rest: Story = {
  args: {
    variant: "rest",
    children: "Rest",
  },
};

/**
 * Power target variant
 */
export const Power: Story = {
  args: {
    variant: "power",
    children: "Power",
  },
};

/**
 * Heart rate target variant
 */
export const HeartRate: Story = {
  args: {
    variant: "heart_rate",
    children: "Heart Rate",
  },
};

/**
 * Small size
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Badge",
  },
};

/**
 * Medium size (default)
 */
export const Medium: Story = {
  args: {
    size: "md",
    children: "Medium Badge",
  },
};

/**
 * Large size
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Badge",
  },
};

/**
 * Badge with icon
 */
export const WithIcon: Story = {
  args: {
    variant: "power",
    icon: <span>⚡</span>,
    children: "Power",
  },
};

/**
 * All intensity variants showcase
 */
export const IntensityVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="warmup">Warmup</Badge>
      <Badge variant="active">Active</Badge>
      <Badge variant="cooldown">Cooldown</Badge>
      <Badge variant="rest">Rest</Badge>
      <Badge variant="recovery">Recovery</Badge>
      <Badge variant="interval">Interval</Badge>
      <Badge variant="other">Other</Badge>
    </div>
  ),
};

/**
 * All target type variants showcase
 */
export const TargetTypeVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="power">Power</Badge>
      <Badge variant="heart_rate">Heart Rate</Badge>
      <Badge variant="cadence">Cadence</Badge>
      <Badge variant="pace">Pace</Badge>
      <Badge variant="stroke_type">Stroke Type</Badge>
      <Badge variant="open">Open</Badge>
    </div>
  ),
};

/**
 * All sizes showcase
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

/**
 * Real-world usage examples
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="warmup" size="sm">
        5 min warmup
      </Badge>
      <Badge variant="active" size="md" icon={<span>⚡</span>}>
        Zone 4 Power
      </Badge>
      <Badge variant="cooldown" size="sm">
        Cool down
      </Badge>
    </div>
  ),
};
