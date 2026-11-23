/**
 * Trace: the record the App keeps, on this device only, of what one run of
 * the assistant did (GLOSSARY.md). It holds identifiers, outcomes and
 * metrics: never a prompt, a message, a document or a model answer, so the
 * schema is `.strict()` and parsed at the single write.
 *
 * `cost` is `priceRun`'s `RunCost` as is, one per model the run reached
 * (a chat turn that generates a workout may reach two). `sent` names, per
 * Provider, the kinds of data the code that built the requests put in them
 * (`kinds`), and apart the kinds it may have carried but cannot count
 * (`declared`, read from the flow registry): earlier replies replayed, and
 * text the model wrote after reading health data.
 */
import { runCostSchema } from "@kaiord/ai/providers";
import { z } from "zod";

import { DATA_KINDS } from "../application/data-flows/data-kinds";
import {
  DESTINATION_IDS,
  type DestinationId,
} from "../application/data-flows/destinations";

const unitSchema = z
  .object({
    agentId: z.string().optional(),
    agentVersion: z.string().optional(),
    promptId: z.string().optional(),
    promptVersion: z.string(),
  })
  .strict();

const toolCallSchema = z
  .object({
    name: z.string(),
    confirmation: z.enum(["athlete", "automatic", "not_needed"]),
    result: z.enum(["ok", "refused", "failed", "unanswered"]),
  })
  .strict();

const destinationSchema = z.enum(
  DESTINATION_IDS as [DestinationId, ...DestinationId[]]
);

const TRACE_FEATURES = ["chat", "generation", "batch", "lab_import"] as const;

export const traceSchema = z
  .object({
    id: z.string(),
    feature: z.enum(TRACE_FEATURES),
    startedAt: z.string(),
    finishedAt: z.string(),
    latencyMs: z.number().int().nonnegative(),
    outcome: z.enum(["ok", "failed", "stopped"]),
    modelCalls: z.number().int().nonnegative(),
    retries: z.number().int().nonnegative(),
    units: z.array(unitSchema),
    tools: z.array(toolCallSchema),
    cost: z.array(runCostSchema),
    totalUsd: z.number().nonnegative().nullable(),
    sent: z.array(
      z
        .object({
          to: destinationSchema,
          kinds: z.array(z.enum(DATA_KINDS)),
          declared: z.array(z.enum(DATA_KINDS)).optional(),
        })
        .strict()
    ),
  })
  .strict();

export type TraceRecord = z.infer<typeof traceSchema>;
export type TraceFeature = TraceRecord["feature"];
export type TraceOutcome = TraceRecord["outcome"];
export type TraceToolCall = TraceRecord["tools"][number];
export type TraceUnit = TraceRecord["units"][number];
export type TraceSent = TraceRecord["sent"][number];
