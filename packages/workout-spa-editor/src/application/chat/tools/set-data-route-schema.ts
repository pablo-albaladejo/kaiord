/**
 * `set_data_route` schemas. The provider-facing `setDataRouteInputSchema` is
 * a single flat `z.object` (top-level JSON Schema `type: "object"`):
 * Anthropic and OpenAI reject a tool whose input schema is a bare `oneOf`,
 * which is what a `z.discriminatedUnion` serialises to. The per-action
 * requirements live in `strictSetDataRouteSchema`, piped after the flat
 * object: the SDK serialises the pipe's input side (one object) while parsing
 * still runs the action-discriminated union and yields its typed output.
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import { dataTypeSourceModeSchema } from "../../../types/data-type-source-policy";
import { integrationPolicyDirectionSchema } from "../../../types/integration-policy";

const routeFields = {
  dataType: z.enum(managedDataTypes),
  integrationId: z.string().min(1),
  direction: integrationPolicyDirectionSchema,
};

const strictSetDataRouteSchema = z
  .discriminatedUnion("action", [
    z.object({ action: z.literal("enable_route"), ...routeFields }),
    z.object({ action: z.literal("disable_route"), ...routeFields }),
    z.object({
      action: z.literal("set_source_policy"),
      dataType: z.enum(managedDataTypes),
      mode: dataTypeSourceModeSchema,
      sourceOrder: z.array(z.string()).optional(),
    }),
  ])
  .superRefine((value, ctx) => {
    if (
      value.action === "set_source_policy" &&
      value.mode === "priority" &&
      (value.sourceOrder?.length ?? 0) === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceOrder"],
        message: "priority mode requires a non-empty sourceOrder",
      });
    }
  });

export const setDataRouteInputSchema = z
  .object({
    action: z
      .enum(["enable_route", "disable_route", "set_source_policy"])
      .describe(
        "enable_route / disable_route require integrationId and " +
          "direction; set_source_policy requires mode (and a non-empty " +
          "sourceOrder when mode is priority)."
      ),
    dataType: z.enum(managedDataTypes),
    integrationId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Integration id, e.g. garmin, whoop, train2go, manual. Required " +
          "for enable_route / disable_route."
      ),
    direction: integrationPolicyDirectionSchema
      .optional()
      .describe("Required for enable_route / disable_route."),
    mode: dataTypeSourceModeSchema
      .optional()
      .describe("Required for set_source_policy."),
    sourceOrder: z
      .array(z.string())
      .optional()
      .describe(
        "Integration ids in priority order, most preferred first. Only " +
          "used by set_source_policy when mode is priority; a single id " +
          "means read only from that source (e.g. 'read sleep only from " +
          "Whoop' -> mode priority, sourceOrder ['whoop'])."
      ),
  })
  .pipe(strictSetDataRouteSchema);
