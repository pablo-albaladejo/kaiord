import { z } from "zod";

/**
 * Write provenance for lab records. The `sourceBridgeId` + `externalId`
 * columns mirror the health-record provenance shape so a future promotion
 * of labs into the Data Hub (a real labs bridge in V2+) is additive rather
 * than a migration. V1 always writes `source: "manual"`.
 */
export const labProvenanceSchema = z.object({
  source: z.enum(["manual", "ai-extracted"]),
  sourceBridgeId: z.string().optional(),
  externalId: z.string().optional(),
});

export type LabProvenance = z.infer<typeof labProvenanceSchema>;
