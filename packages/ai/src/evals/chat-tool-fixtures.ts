/**
 * Local fixtures for the F6 Data Hub chat-tool evals. The schemas and
 * descriptions mirror the real tools registered in
 * @kaiord/workout-spa-editor (application/chat/tools/get-data-routes-tool.ts,
 * set-data-route-tool.ts) — @kaiord/ai cannot depend on the SPA package, so
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

const routeFields = {
  dataType: z.enum(managedDataTypes),
  integrationId: z.string().min(1),
  direction: directionSchema,
};

const setDataRouteSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enable_route"), ...routeFields }),
  z.object({ action: z.literal("disable_route"), ...routeFields }),
  z.object({
    action: z.literal("set_source_policy"),
    dataType: z.enum(managedDataTypes),
    mode: sourceModeSchema,
    sourceOrder: z.array(z.string()).optional(),
  }),
]);

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
      "Change Data Hub routing for the active profile. enable_route / " +
      "disable_route turn a (data type, integration, direction) route on " +
      "or off. set_source_policy sets whether a data type merges every " +
      "enabled source (union) or reads a priority order with automatic " +
      "fallback (priority) — e.g. 'read sleep only from Whoop' is " +
      "set_source_policy with mode priority and sourceOrder ['whoop']. " +
      "Requires the user to confirm before running.",
    inputSchema: setDataRouteSchema,
    requiresConfirmation: true,
    execute: async (raw) => setDataRouteSchema.parse(raw),
  },
];
