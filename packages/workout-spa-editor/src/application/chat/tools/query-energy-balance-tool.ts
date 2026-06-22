import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import { buildDayEnergyBalance } from "../../energy/build-day-energy-balance";
import type { DayEnergyBalanceResult } from "../../energy/day-energy-balance-result";
import type { ReadToolDeps } from "./chat-tool-deps";
import { clampRange } from "./clamp-range";
import { buildGoalContext, eachDay } from "./query-energy-balance-goal";

const inputSchema = z.object({
  date: z
    .string()
    .optional()
    .describe("Start date YYYY-MM-DD (defaults today)"),
  dateTo: z.string().optional().describe("End date YYYY-MM-DD (defaults date)"),
});

export const createQueryEnergyBalanceTool = (deps: ReadToolDeps): ChatTool => ({
  name: "query_energy_balance",
  description:
    "Read the user's per-day energy balance (expenditure, intake, net " +
    "deficit/surplus, target, source) plus active-goal context for a date " +
    "range. Use it to answer deficit/surplus, remaining-kcal, and goal questions.",
  inputSchema,
  requiresConfirmation: false,
  execute: async (raw) => {
    const input = inputSchema.parse(raw);
    const range = clampRange(
      { dateFrom: input.date, dateTo: input.dateTo },
      deps.today
    );
    const to = input.dateTo ?? input.date ?? deps.today;
    const days = eachDay(range.from, to);
    const balances = await Promise.all(
      days.map(
        (date): Promise<DayEnergyBalanceResult> =>
          buildDayEnergyBalance({
            persistence: deps.persistence,
            profileId: deps.profileId,
            date,
            today: deps.today,
          })
      )
    );
    const todayResult = await buildDayEnergyBalance({
      persistence: deps.persistence,
      profileId: deps.profileId,
      date: deps.today,
      today: deps.today,
    });
    return {
      range_used: { from: range.from, to },
      goal: await buildGoalContext(deps, todayResult),
      days: balances,
    };
  },
});
