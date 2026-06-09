import type { Sport } from "@kaiord/core";
import { sportCategory } from "@kaiord/core";
import { z } from "zod";

export const tcxSportSchema = z.enum(["Running", "Biking", "Other"]);

export type TcxSport = z.infer<typeof tcxSportSchema>;

export const TCX_TO_KRD_SPORT: Record<TcxSport, Sport> = {
  Running: "running",
  Biking: "cycling",
  Other: "generic",
};

// TCX supports only 3 sport values; collapse via sportCategory.
// cycling → Biking, running → Running, swimming/other → Other.
export const krdToTcxSport = (sport: Sport): TcxSport => {
  const category = sportCategory(sport);
  if (category === "cycling") return "Biking";
  if (category === "running") return "Running";
  return "Other";
};
