import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

export const integrationPolicyModeSchema = z.enum(["manual", "auto"]);
export type IntegrationPolicyMode = z.infer<typeof integrationPolicyModeSchema>;

export const integrationPolicyDirectionSchema = z.enum(["import", "export"]);
export type IntegrationPolicyDirection = z.infer<
  typeof integrationPolicyDirectionSchema
>;

export const integrationPolicySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  bridgeId: z.string().min(1),
  direction: integrationPolicyDirectionSchema,
  mode: integrationPolicyModeSchema,
  enabled: z.boolean(),
  updatedAt: z.iso.datetime(),
});
export type IntegrationPolicy = z.infer<typeof integrationPolicySchema>;
