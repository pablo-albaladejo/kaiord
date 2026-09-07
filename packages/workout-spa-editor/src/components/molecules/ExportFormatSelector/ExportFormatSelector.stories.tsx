import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { KRD } from "../../../types/krd";
import { ExportFormatSelector } from "./ExportFormatSelector";

const DEMO_WORKOUT: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2025-01-15T10:30:00Z",
    sport: "running",
  },
  extensions: {
    structured_workout: {
      name: "Tempo Run",
      sport: "running",
      steps: [],
    },
  },
};

const meta = {
  title: "Molecules/ExportFormatSelector",
  component: ExportFormatSelector,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    onFormatChange: fn(),
    workout: DEMO_WORKOUT,
  },
} satisfies Meta<typeof ExportFormatSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Binary Garmin device format — warns it may drop some workout features. */
export const FitFormat: Story = {
  args: { currentFormat: "fit" },
};

/** Garmin/TrainingPeaks/Strava XML — warns about limited advanced targets. */
export const TcxFormat: Story = {
  args: { currentFormat: "tcx" },
};

/** Garmin Connect's structured JSON — warns it's API-shaped, not archival. */
export const GcnFormat: Story = {
  args: { currentFormat: "gcn" },
};

/** The canonical Kaiord format — no compatibility warning to show. */
export const KrdFormatNoWarning: Story = {
  args: { currentFormat: "krd" },
};

/** No workout loaded yet and the selector is disabled — nothing to warn about. */
export const DisabledWithoutAWorkout: Story = {
  args: { currentFormat: "zwo", workout: undefined, disabled: true },
};
