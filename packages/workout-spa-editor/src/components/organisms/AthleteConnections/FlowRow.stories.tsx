import type { Meta, StoryObj } from "@storybook/react";

import { FlowRow } from "./FlowRow";

const meta = {
  title: "Organisms/AthleteConnections/FlowRow",
  component: FlowRow,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FlowRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Import flow (emerald direction tile, toggle on).
 */
export const ImportEnabled: Story = {
  args: {
    flow: {
      label: "Completed activities",
      sublabel: "Import finished workouts",
      dataType: "workout",
      direction: "import",
    },
    availability: "operational",
    checked: true,
    onToggle: () => {},
  },
};

/**
 * Export flow (sky direction tile, toggle off).
 */
export const ExportDisabled: Story = {
  args: {
    flow: {
      label: "Planned workouts",
      sublabel: "Push planned sessions",
      dataType: "workout",
      direction: "export",
    },
    availability: "operational",
    checked: false,
    onToggle: () => {},
  },
};

/**
 * Import flow with no backend on the connected bridge — badge instead of
 * an operative toggle, honest fallback to manual FIT import.
 */
export const ImportManual: Story = {
  args: {
    flow: {
      label: "Daily readiness (HRV, sleep)",
      sublabel: "Import recovery signals",
      dataType: "hrv",
      direction: "import",
    },
    availability: "manual",
    checked: false,
    onToggle: () => {},
  },
};

/**
 * Export flow with no backend on the connected bridge — no manual push
 * equivalent exists, so it's flagged "coming soon" instead.
 */
export const ExportComingSoon: Story = {
  args: {
    flow: {
      label: "Training zones",
      sublabel: "Push updated zones",
      dataType: "training-zones",
      direction: "export",
    },
    availability: "coming-soon",
    checked: false,
    onToggle: () => {},
  },
};
