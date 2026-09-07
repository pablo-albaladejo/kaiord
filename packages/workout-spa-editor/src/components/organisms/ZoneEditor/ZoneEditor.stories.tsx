import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within } from "storybook/test";

import type { Profile } from "../../../types/profile";
import {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../../../types/profile";
import { ZoneEditor } from "./ZoneEditor";

const meta = {
  title: "Organisms/ZoneEditor",
  component: ZoneEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ZoneEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const hrZonesWithValues = [
  { zone: 1, name: "Recovery", minBpm: 50, maxBpm: 113 },
  { zone: 2, name: "Aerobic", minBpm: 114, maxBpm: 132 },
  { zone: 3, name: "Tempo", minBpm: 133, maxBpm: 151 },
  { zone: 4, name: "Threshold", minBpm: 152, maxBpm: 170 },
  { zone: 5, name: "VO2 Max", minBpm: 171, maxBpm: 190 },
];

const profileWithFtpAndLthr: Profile = {
  id: "profile-1",
  name: "Marta Rivera",
  bodyWeight: 62,
  sportZones: {
    cycling: {
      thresholds: { ftp: 250, lthr: 190 },
      heartRateZones: { method: "custom", zones: hrZonesWithValues },
      powerZones: { method: "coggan-7", zones: DEFAULT_POWER_ZONES },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: DEFAULT_HEART_RATE_ZONES },
    },
  },
  linkedAccounts: [],
  createdAt: "2026-05-01T10:00:00Z",
  updatedAt: "2026-05-01T10:00:00Z",
};

const profileWithoutThresholds: Profile = {
  ...profileWithFtpAndLthr,
  id: "profile-2",
  name: "New Athlete",
  sportZones: {
    cycling: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: DEFAULT_HEART_RATE_ZONES },
      powerZones: { method: "coggan-7", zones: DEFAULT_POWER_ZONES },
    },
    generic: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: DEFAULT_HEART_RATE_ZONES },
    },
  },
};

export const PowerZonesWithFtp: Story = {
  args: {
    profile: profileWithFtpAndLthr,
    zoneType: "power",
  },
};

export const PowerZonesWithoutFtp: Story = {
  args: {
    profile: profileWithoutThresholds,
    zoneType: "power",
  },
};

export const HeartRateZonesWithLthr: Story = {
  args: {
    profile: profileWithFtpAndLthr,
    zoneType: "heartRate",
  },
};

export const HeartRateZonesWithoutLthr: Story = {
  args: {
    profile: profileWithoutThresholds,
    zoneType: "heartRate",
  },
};

/** Zone 1's max % is cleared to 0, which is below its min — reproduces the
 * "Min must be less than max" validation panel and disables Save. */
export const ValidationError: Story = {
  args: {
    profile: profileWithFtpAndLthr,
    zoneType: "power",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `noUncheckedIndexedAccess` is on, so index 0 is `HTMLElement | undefined`.
    // Failing loudly here beats a confusing "not an Element" further down.
    const [zoneOneMax] = canvas.getAllByLabelText(/max %/i);
    if (!zoneOneMax) throw new Error("no zone rows rendered");
    await userEvent.clear(zoneOneMax);
    await userEvent.type(zoneOneMax, "0");
  },
};
