import type { SwimStroke } from "@kaiord/core";
import type { z } from "zod";
import type { GarminStrokeType, strokeTypeKeySchema } from "../schemas/common";

type StrokeTypeKey = NonNullable<z.infer<typeof strokeTypeKeySchema>>;

const GARMIN_TO_KRD_STROKE: Record<string, SwimStroke> = {
  free: "freestyle",
  backstroke: "backstroke",
  breaststroke: "breaststroke",
  fly: "butterfly",
  drill: "drill",
  mixed: "mixed",
  im: "im",
};

const KRD_TO_GARMIN_STROKE: Record<
  string,
  { id: number; key: StrokeTypeKey; order: number }
> = {
  freestyle: { id: 6, key: "free", order: 6 },
  backstroke: { id: 2, key: "backstroke", order: 2 },
  breaststroke: { id: 3, key: "breaststroke", order: 3 },
  butterfly: { id: 5, key: "fly", order: 5 },
  drill: { id: 4, key: "drill", order: 4 },
  mixed: { id: 7, key: "mixed", order: 7 },
  im: { id: 8, key: "im", order: 8 },
};

export const mapGarminStrokeToKrd = (
  strokeTypeKey: string | null,
  strokeTypeId: number
): SwimStroke | undefined => {
  if (!strokeTypeKey || strokeTypeId === 0) return undefined;
  if (strokeTypeKey === "any_stroke") return undefined;
  return GARMIN_TO_KRD_STROKE[strokeTypeKey];
};

export const mapKrdStrokeToGarmin = (
  stroke?: SwimStroke | string
): GarminStrokeType => {
  if (!stroke) {
    return { strokeTypeId: 0, strokeTypeKey: null, displayOrder: 0 };
  }
  const mapped = KRD_TO_GARMIN_STROKE[stroke];
  if (!mapped) {
    return { strokeTypeId: 0, strokeTypeKey: null, displayOrder: 0 };
  }
  return {
    strokeTypeId: mapped.id,
    strokeTypeKey: mapped.key,
    displayOrder: mapped.order,
  };
};
