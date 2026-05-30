import type { Meta, StoryObj } from "@storybook/react";

import { ZoneMap } from "./ZoneMap";
import type { ZoneMapEntry } from "./ZoneMap";

const POWER_ZONES: ZoneMapEntry[] = [
  { n: 1, name: "Active Recovery", range: "< 128 W", pct: "< 55%", w: 1 },
  { n: 2, name: "Endurance", range: "128–174 W", pct: "55–75%", w: 1.5 },
  { n: 3, name: "Tempo", range: "175–209 W", pct: "75–90%", w: 1.2 },
  { n: 4, name: "Threshold", range: "210–255 W", pct: "90–105%", w: 1 },
  { n: 5, name: "VO2 Max", range: "> 255 W", pct: "> 105%", w: 0.8 },
];

const meta = {
  title: "Organisms/ZoneMap",
  component: ZoneMap,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    zones: {
      description: "Array of zone entries with n, name, range, pct, and w",
    },
    className: {
      description: "Additional CSS classes",
      control: { type: "text" },
    },
  },
} satisfies Meta<typeof ZoneMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    zones: POWER_ZONES,
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] bg-slate-900 p-4 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const EqualWeights: Story = {
  args: {
    zones: POWER_ZONES.map((z) => ({ ...z, w: 1 })),
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] bg-slate-900 p-4 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export const ThreeZones: Story = {
  args: {
    zones: [
      { n: 1, name: "Recovery", range: "< 120 W", pct: "< 50%", w: 1 },
      { n: 3, name: "Tempo", range: "170–210 W", pct: "70–90%", w: 1.5 },
      { n: 5, name: "VO2 Max", range: "> 250 W", pct: "> 105%", w: 0.7 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] bg-slate-900 p-4 rounded-xl">
        <Story />
      </div>
    ),
  ],
};
