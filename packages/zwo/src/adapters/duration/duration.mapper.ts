export type ZwiftDurationData = {
  Duration?: number;
  durationType?: "time" | "distance";
  // Kaiord round-trip attributes
  "kaiord:originalDurationType"?: string;
  "kaiord:originalDurationMeters"?: number;
  "kaiord:originalDurationBpm"?: number;
  "kaiord:originalDurationWatts"?: number;
};
