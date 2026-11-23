/**
 * Local fixtures for the F6 Data Hub chat-tool evals. The schemas and
 * descriptions mirror the real tools registered in
 * @kaiord/workout-spa-editor (application/chat/tools/get-data-routes-tool.ts,
 * set-data-route-tool.ts, set-authority-tool.ts) — @kaiord/ai cannot depend on the SPA package, so
 * these are hand-kept in sync; drift is caught by review.
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import type { ChatTool } from "../index";

const directionSchema = z.enum(["import", "export"]);
const sourceModeSchema = z.enum(["union", "priority"]);

const getDataRoutesSchema = z.object({
  dataType: z.enum(managedDataTypes).optional(),
});

/** `set_data_route`: switch one source on or off (SPA set-data-route-schema.ts). */
const setDataRouteSchema = z.object({
  action: z
    .enum(["enable_route", "disable_route"])
    .describe("enable_route switches the route on, disable_route off."),
  dataType: z.enum(managedDataTypes),
  integrationId: z
    .string()
    .min(1)
    .describe("Integration id, e.g. garmin, whoop, train2go, tanita."),
  direction: directionSchema.describe(
    "import: the source sends this data to Kaiord; export: Kaiord sends it."
  ),
});

/** `set_authority`: one flat object (top-level JSON Schema `type:
    "object"`, which Anthropic/OpenAI require) refined so a priority order
    is never empty (SPA set-authority-schema.ts). */
const setAuthoritySchema = z
  .object({
    dataType: z.enum(managedDataTypes),
    mode: sourceModeSchema.describe(
      "priority: the first source in sourceOrder that has a value decides; " +
        "union: keep and show every source."
    ),
    sourceOrder: z
      .array(z.string())
      .optional()
      .describe(
        "Integration ids in priority order, most preferred first. Required " +
          "and non-empty when mode is priority; a single id means read only " +
          "from that source (e.g. 'read sleep only from Whoop' -> mode " +
          "priority, sourceOrder ['whoop'])."
      ),
  })
  .refine((v) => v.mode !== "priority" || (v.sourceOrder?.length ?? 0) > 0, {
    path: ["sourceOrder"],
    message: "priority mode requires a non-empty sourceOrder",
  });

/** Canned get_data_routes answer: planned-session imports actively from
    Train2Go — the fixture the "where do my planned sessions come from"
    scenario is graded against. */
const FIXTURE_ROUTES = {
  day: "2026-07-07",
  dataTypes: [
    {
      dataType: "planned-session",
      label: "Planned Session",
      routes: [
        {
          integrationId: "train2go",
          direction: "import",
          state: "active",
          enabled: true,
          mode: "auto",
          lastSyncedAt: "2026-07-06T08:00:00.000Z",
        },
      ],
      sourcePolicy: { mode: "union", sourceOrder: [] },
    },
  ],
};

export const createHubChatToolFixtures = (): ChatTool[] => [
  {
    name: "get_data_routes",
    description:
      "Read the Data Hub routing for the active profile: which integration " +
      "each data type is imported from or exported to, whether the route " +
      "is enabled, its multi-source semantics (union or priority order), " +
      "and freshness. Use it for questions like 'where do my planned " +
      "sessions come from'.",
    inputSchema: getDataRoutesSchema,
    requiresConfirmation: false,
    execute: async () => FIXTURE_ROUTES,
  },
  {
    name: "set_data_route",
    description:
      "Switch one source on or off for a kind of data on the active profile: " +
      "enable_route / disable_route turn a (data type, integration, " +
      "direction) route on or off, so that source's data is imported (or " +
      "sent) or not. It does not choose which source decides when several " +
      "report the same kind. Requires the user to confirm before running; " +
      "the result reflects the new persisted state.",
    inputSchema: setDataRouteSchema,
    requiresConfirmation: true,
    execute: async (raw) => setDataRouteSchema.parse(raw),
  },
  {
    name: "set_authority",
    description:
      "Choose which source decides a kind of data for the active profile, " +
      "overriding the App's automatic choice. mode priority reads sourceOrder " +
      "with automatic fallback; mode union keeps and shows every source. With " +
      "nothing chosen, the App decides by itself (the athlete's own entries " +
      "first, then a fixed order of Platforms) for: training-zones, weight, " +
      "sleep, hrv, daily-wellness, body-composition, stress, strain, vitals, " +
      "heart-rate-series; and keeps every source for: workout, " +
      "planned-session, activity. Requires the user to confirm before " +
      "running; the result reflects the new persisted state.",
    inputSchema: setAuthoritySchema,
    requiresConfirmation: true,
    execute: async (raw) => setAuthoritySchema.parse(raw),
  },
];
