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
    checked: false,
    onToggle: () => {},
  },
};
