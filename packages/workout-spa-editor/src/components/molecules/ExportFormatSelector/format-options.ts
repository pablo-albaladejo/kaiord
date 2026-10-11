import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtension } from "../../../utils/file-format-metadata";

export type FormatOption = {
  value: WorkoutFileFormat;
  label: string;
  /** An `editor` translation key, resolved where the option renders. */
  descriptionKey: string;
  compatibility: string[];
};

export const formatOptions: FormatOption[] = [
  {
    value: "fit",
    label: "FIT",
    descriptionKey: "exportFormat.descriptions.fit",
    compatibility: ["Garmin devices", "Garmin Connect", "TrainingPeaks"],
  },
  {
    value: "tcx",
    label: "TCX",
    descriptionKey: "exportFormat.descriptions.tcx",
    compatibility: ["Garmin Connect", "TrainingPeaks", "Strava"],
  },
  {
    value: "zwo",
    label: "ZWO",
    descriptionKey: "exportFormat.descriptions.zwo",
    compatibility: ["Zwift"],
  },
  {
    value: "gcn",
    label: "GCN",
    descriptionKey: "exportFormat.descriptions.gcn",
    compatibility: ["Garmin Connect", "Garmin devices"],
  },
  {
    value: "krd",
    label: "KRD",
    descriptionKey: "exportFormat.descriptions.krd",
    compatibility: ["Kaiord tools", "Web editors"],
  },
];

export const getFileExtensionForFormat = (
  format: WorkoutFileFormat
): string => {
  return getFileExtension(format);
};
