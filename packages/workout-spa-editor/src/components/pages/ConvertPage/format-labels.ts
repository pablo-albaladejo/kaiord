import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

// Format names are product names, identical in every locale.
const LABELS: Record<WorkoutFileFormat, string> = {
  fit: "FIT",
  tcx: "TCX",
  zwo: "ZWO (Zwift)",
  gcn: "Garmin Connect",
  krd: "KRD",
};

export const formatLabel = (format: WorkoutFileFormat): string =>
  LABELS[format];
