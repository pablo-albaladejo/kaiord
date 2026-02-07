import { z } from "zod";

// Power target as FTP percentage (0.0 to 3.0)
export const zwiftPowerTargetSchema = z.number().min(0.0).max(3.0);

export type ZwiftPowerTarget = z.infer<typeof zwiftPowerTargetSchema>;

// Pace target as seconds per kilometer
export const zwiftPaceTargetSchema = z.number().positive();

export type ZwiftPaceTarget = z.infer<typeof zwiftPaceTargetSchema>;

// Cadence target in RPM (revolutions per minute)
export const zwiftCadenceTargetSchema = z.number().int().positive();

export type ZwiftCadenceTarget = z.infer<typeof zwiftCadenceTargetSchema>;
