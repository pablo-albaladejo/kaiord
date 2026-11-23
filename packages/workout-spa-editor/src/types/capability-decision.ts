/**
 * The athlete's decision for one Capability (`lib/capabilities`), one row
 * per (profile, Capability) in its own store, so a build that rewrites the
 * preferences row from a fixed list of fields can never erase it. It rides
 * the Drive snapshot (merged per row by `updatedAt`) and the backup file.
 */
import { z } from "zod";

export const capabilityDecisionSchema = z.object({
  profileId: z.string().min(1),
  capabilityId: z.string().min(1),
  on: z.boolean(),
  updatedAt: z.iso.datetime(),
});

export type CapabilityDecision = z.infer<typeof capabilityDecisionSchema>;
