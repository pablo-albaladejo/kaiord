/**
 * `set_data_route` input: switch one (data type, integration, direction)
 * route on or off. A single flat `z.object` (top-level JSON Schema
 * `type: "object"`), which every Provider accepts.
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import { integrationPolicyDirectionSchema } from "../../../types/integration-policy";

export const setDataRouteInputSchema = z.object({
  action: z
    .enum(["enable_route", "disable_route"])
    .describe("enable_route switches the route on, disable_route off."),
  dataType: z.enum(managedDataTypes),
  integrationId: z
    .string()
    .min(1)
    .describe("Integration id, e.g. garmin, whoop, train2go, tanita."),
  direction: integrationPolicyDirectionSchema.describe(
    "import: the source sends this data to Kaiord; export: Kaiord sends it."
  ),
});
