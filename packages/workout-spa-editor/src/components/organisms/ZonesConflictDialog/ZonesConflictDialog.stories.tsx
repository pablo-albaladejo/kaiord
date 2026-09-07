import type { Meta, StoryObj } from "@storybook/react";

import type { ConflictItem } from "../../../types/coaching-zones";
import { ZonesConflictDialog } from "./ZonesConflictDialog";

const meta = {
  title: "Organisms/ZonesConflictDialog",
  component: ZonesConflictDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ZonesConflictDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two threshold scalars in conflict — each renders as its own row
 * with an accept/reject radio pair.
 */
export const ScalarConflicts: Story = {
  args: {
    open: true,
    conflicts: [
      { field: "cycling.thresholds.ftp", current: 200, incoming: 270 },
      { field: "running.thresholds.lthr", current: 150, incoming: 168 },
    ] satisfies ConflictItem[],
    onConfirm: (decisions) => console.log("onConfirm", decisions),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * Band-level conflicts within one sport/kind table collapse into a
 * single group row with a "N bands differ" summary.
 */
export const BandGroupConflict: Story = {
  args: {
    open: true,
    conflicts: [
      {
        field: "cycling.heartRateZones.z1.minBpm",
        current: 100,
        incoming: 107,
      },
      {
        field: "cycling.heartRateZones.z1.maxBpm",
        current: 130,
        incoming: 133,
      },
      {
        field: "cycling.heartRateZones.z2.minBpm",
        current: 131,
        incoming: 134,
      },
      {
        field: "cycling.heartRateZones.z2.maxBpm",
        current: 145,
        incoming: 147,
      },
    ] satisfies ConflictItem[],
    onConfirm: (decisions) => console.log("onConfirm", decisions),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * FTP plus its dependent cycling power bands couple into a single
 * "Cycling threshold + zones" group, since accepting one without the
 * other would leave the zones inconsistent with the threshold.
 */
export const CoupledFtpAndPowerZones: Story = {
  args: {
    open: true,
    conflicts: [
      { field: "cycling.thresholds.ftp", current: 200, incoming: 268 },
      {
        field: "cycling.powerZones.z4.minPercent",
        current: 91,
        incoming: 90,
      },
      {
        field: "cycling.powerZones.z4.maxPercent",
        current: 105,
        incoming: 100,
      },
    ] satisfies ConflictItem[],
    onConfirm: (decisions) => console.log("onConfirm", decisions),
    onCancel: () => console.log("onCancel"),
  },
};

/**
 * A mixed set — a standalone scalar plus a band group — preserves
 * insertion order: the scalar row renders first, then the group.
 */
export const MixedScalarAndBandGroups: Story = {
  args: {
    open: true,
    conflicts: [
      { field: "cycling.thresholds.lthr", current: 160, incoming: 174 },
      {
        field: "cycling.heartRateZones.z2.minBpm",
        current: 131,
        incoming: 134,
      },
      {
        field: "cycling.heartRateZones.z2.maxBpm",
        current: 145,
        incoming: 147,
      },
    ] satisfies ConflictItem[],
    onConfirm: (decisions) => console.log("onConfirm", decisions),
    onCancel: () => console.log("onCancel"),
  },
};
