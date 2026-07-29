/**
 * Training / Recovery / Body — a presentation grouping that exists nowhere in
 * `@kaiord/core`. `managedDataTypes` is a flat list, so a 14th type added
 * there would belong to no group and silently render on no surface at all.
 * `data-type-groups.test.ts` pins the partition instead of leaving that to
 * whoever notices; three types (strain, vitals, heart-rate-series) were
 * already added to the flat list exactly that way.
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
