import type { Sport } from "@kaiord/core";
import { z } from "zod";

export const zwiftSportSchema = z.enum(["bike", "run"]);

export type ZwiftSport = z.infer<typeof zwiftSportSchema>;

// Mapping from Zwift sport types to KRD sport types
export const ZWIFT_TO_KRD_SPORT: Record<ZwiftSport, Sport> = {
  bike: "cycling",
  run: "running",
};
