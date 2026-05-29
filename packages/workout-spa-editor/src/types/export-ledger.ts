import { managedDataTypes } from "@kaiord/core";
import { z } from "zod";

export const exportLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  kaiordRecordId: z.string().uuid(),
  dataType: z.enum(managedDataTypes),
  destinationBridgeId: z.string().min(1),
  destinationExternalId: z.string().min(1),
  contentHash: z.string().min(1),
  exportedAt: z.iso.datetime(),
});
export type ExportLedgerEntry = z.infer<typeof exportLedgerEntrySchema>;
