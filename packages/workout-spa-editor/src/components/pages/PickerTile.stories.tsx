import type { Meta, StoryObj } from "@storybook/react";
import { Download, Library, PenLine } from "lucide-react";

import { PickerTile } from "./PickerTile";

/**
 * PickerTile is the presentational button used by `NewWorkoutPicker`'s
 * three-tile grid (Scratch / Import / Template). Pure props in, click
 * out — no router, no store, no providers. Shipped in PR #650.
 */
const meta = {
  title: "Pages/PickerTile",
  component: PickerTile,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "One of the three tiles rendered in `NewWorkoutPicker`. Pure presentational button — icon + title + description + click callback.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    id: {
      control: "select",
      options: ["scratch", "import", "template"],
      description: "Tile variant; drives the `data-testid` and the icon",
    },
    title: { control: "text" },
    description: { control: "text" },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof PickerTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scratch: Story = {
  args: {
    id: "scratch",
    icon: PenLine,
    title: "From scratch",
    description: "Build a new workout from a blank canvas",
  },
};

export const Import: Story = {
  args: {
    id: "import",
    icon: Download,
    title: "Import",
    description: "Upload a FIT, TCX, or ZWO file",
  },
};

export const Template: Story = {
  args: {
    id: "template",
    icon: Library,
    title: "From template",
    description: "Start from an existing workout in your library",
  },
};
