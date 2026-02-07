import { z } from "zod";
import type { Sport } from "@kaiord/core";

export const zwiftSportSchema = z.enum(["bike", "run"]);

export type ZwiftSport = z.infer<typeof zwiftSportSchema>;

// Mapping from Zwift sport types to KRD sport types
export const ZWIFT_TO_KRD_SPORT: Record<ZwiftSport, Sport> = {
  bike: "cycling",
  run: "running",
};

// Mapping from KRD sport types to Zwift sport types
export const KRD_TO_ZWIFT_SPORT: Record<Sport, ZwiftSport | undefined> = {
  cycling: "bike",
  running: "run",
  swimming: undefined,
  generic: undefined,
};
