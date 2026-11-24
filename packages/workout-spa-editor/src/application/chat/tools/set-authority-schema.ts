/**
 * `set_authority` input. The provider-facing schema is one flat `z.object`
 * (Anthropic and OpenAI reject a bare `oneOf`); the rule that a priority
 * order is not empty is a refinement after it, so the SDK still serialises
 * one object while parsing refuses an empty order.
 */
import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

import { dataTypeSourceModeSchema } from "../../../types/data-type-source-policy";

export const setAuthorityInputSchema = z
  .object({
    dataType: z.enum(managedDataTypes),
    mode: dataTypeSourceModeSchema.describe(
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
  .superRefine((value, ctx) => {
    if (value.mode === "priority" && (value.sourceOrder?.length ?? 0) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceOrder"],
        message: "priority mode requires a non-empty sourceOrder",
      });
    }
  });
