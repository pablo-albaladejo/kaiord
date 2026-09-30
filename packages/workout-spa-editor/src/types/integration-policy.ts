import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

export const integrationPolicyModeSchema = z.enum(["manual", "auto"]);
export type IntegrationPolicyMode = z.infer<typeof integrationPolicyModeSchema>;

export const integrationPolicyDirectionSchema = z.enum(["import", "export"]);
export type IntegrationPolicyDirection = z.infer<
  typeof integrationPolicyDirectionSchema
>;

/** Provenance of an `enabled: false` written by an account Disconnect, so a
    later reconnect can restore exactly what it switched off. Absent on a
    user's own "off", which nothing but the user may undo. Not indexed. */
export const DISABLED_BY_DISCONNECT = "disconnect";

export const integrationPolicySchema = z.object({
  id: z.string().uuid(),
  profileId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  bridgeId: z.string().min(1),
  direction: integrationPolicyDirectionSchema,
  mode: integrationPolicyModeSchema,
  enabled: z.boolean(),
  disabledBy: z.literal(DISABLED_BY_DISCONNECT).optional(),
  updatedAt: z.iso.datetime(),
});
export type IntegrationPolicy = z.infer<typeof integrationPolicySchema>;
