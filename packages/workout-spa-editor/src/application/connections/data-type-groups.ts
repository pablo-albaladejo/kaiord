/**
 * `managedDataTypes` is a flat list, so a type added there belongs to no group
 * and renders on no surface until it is placed here. The partition is pinned
 * by test in both directions rather than left to whoever notices.
 */
import type { ManagedDataType } from "@kaiord/core";

export type DataTypeGroupId = "training" | "recovery" | "body";

export type DataTypeGroup = {
  readonly id: DataTypeGroupId;
  readonly types: readonly ManagedDataType[];
};

export const DATA_TYPE_GROUPS: readonly DataTypeGroup[] = [
  {
    id: "training",
    types: [
      "workout",
      "planned-session",
      "activity",
      "training-zones",
      "heart-rate-series",
    ],
  },
  {
    id: "recovery",
    types: ["sleep", "hrv", "daily-wellness", "stress", "strain"],
  },
  {
    id: "body",
    types: ["weight", "body-composition", "vitals"],
  },
];
