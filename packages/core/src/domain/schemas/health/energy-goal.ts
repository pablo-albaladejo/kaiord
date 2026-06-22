import { z } from "zod";

/**
 * Body-composition objective driving the deficit/surplus engine.
 *
 * `fat_loss` and `muscle_gain` move weight toward `target_weight_kg`;
 * `maintain` holds it. Weights are strictly positive kilograms and
 * `target_date` is an ISO calendar date marking the planned horizon.
 */
export const goalTypeSchema = z.enum(["fat_loss", "muscle_gain", "maintain"]);

export type GoalType = z.infer<typeof goalTypeSchema>;

export const energyGoalSchema = z.object({
  goal_type: goalTypeSchema,
  start_weight_kg: z.number().positive(),
  target_weight_kg: z.number().positive(),
  target_date: z.iso.date(),
});

export type EnergyGoal = z.infer<typeof energyGoalSchema>;
