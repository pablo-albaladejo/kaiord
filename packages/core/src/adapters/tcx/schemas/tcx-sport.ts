import { z } from "zod";
import type { Sport } from "../../../domain/schemas/sport";

export const tcxSportSchema = z.enum(["Running", "Biking", "Other"]);

export type TcxSport = z.infer<typeof tcxSportSchema>;

export const TCX_TO_KRD_SPORT: Record<TcxSport, Sport> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic",
};
