/**
 * Coaching KRD warmup template builder.
 *
 * `convertCoachingActivityManual` materialises a structured workout
 * from a coaching activity without invoking the LLM. The editor's
 * empty-state still renders a "no structured data yet" message when
 * `krd.steps` is empty, so the manual path SHALL initialise the KRD
 * with a single visible step the user can edit or delete as their
 * first action — see spa-coaching-integration / "Manual creation
 * from coaching activity (template KRD)".
 *
 * Heart-rate Z1 is sport-agnostic (cycling, running, swimming all
 * have HR zone definitions); using it avoids encoding a sport-aware
 * branch here that would drift from zone-method-aware reconcile.
 */
import { createWorkoutKRD } from "@kaiord/core";

import type { KRD, Sport } from "../../types/schemas";

const TEN_MINUTES_SECONDS = 600;

const isKnownSport = (sport: string): sport is Sport =>
  sport === "cycling" ||
  sport === "running" ||
  sport === "swimming" ||
  sport === "generic";

export const buildCoachingTemplateKrd = (sport: string): KRD =>
  createWorkoutKRD({
    sport: isKnownSport(sport) ? sport : "generic",
    steps: [
      {
        stepIndex: 0,
        name: "Warmup",
        durationType: "time",
        duration: { type: "time", seconds: TEN_MINUTES_SECONDS },
        targetType: "heart_rate",
        target: { type: "heart_rate", value: { unit: "zone", value: 1 } },
        intensity: "warmup",
      },
    ],
  });
