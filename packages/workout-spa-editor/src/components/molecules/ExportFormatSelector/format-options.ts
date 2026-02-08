import { getFileExtension } from "../../../utils/file-format-metadata";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

export type FormatOption = {
  value: WorkoutFileFormat;
  label: string;
  description: string;
  compatibility: string[];
};

export const formatOptions: FormatOption[] = [
  {
    value: "fit",
    label: "FIT",
    description: "Garmin FIT format - Binary format for fitness devices",
    compatibility: ["Garmin devices", "Garmin Connect", "TrainingPeaks"],
  },
  {
    value: "tcx",
    label: "TCX",
    description: "Training Center XML - Garmin's XML workout format",
    compatibility: ["Garmin Connect", "TrainingPeaks", "Strava"],
  },
  {
    value: "zwo",
    label: "ZWO",
    description: "Zwift Workout - XML format for Zwift platform",
    compatibility: ["Zwift"],
  },
  {
    value: "gcn",
    label: "GCN",
    description:
      "Garmin Connect JSON - Structured workout for Garmin Connect API",
    compatibility: ["Garmin Connect", "Garmin devices"],
  },
  {
    value: "krd",
    label: "KRD",
    description: "Kaiord format - JSON-based canonical workout format",
    compatibility: ["Kaiord tools", "Web editors"],
  },
];

export const getFileExtensionForFormat = (
  format: WorkoutFileFormat
): string => {
  return getFileExtension(format);
};
