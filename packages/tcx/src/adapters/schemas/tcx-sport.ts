import type { Sport } from "@kaiord/core";
import { z } from "zod";

export const tcxSportSchema = z.enum(["Running", "Biking", "Other"]);

export type TcxSport = z.infer<typeof tcxSportSchema>;

export const TCX_TO_KRD_SPORT: Record<TcxSport, Sport> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic",
};

export const KRD_TO_TCX_SPORT: Record<Sport, TcxSport> = {
  running: "Running",
  cycling: "Biking",
  swimming: "Other",
  generic: "Other",
};
