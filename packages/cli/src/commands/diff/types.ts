import { z } from "zod";
import { fileFormatSchema } from "../../utils/format-detector";

export const diffOptionsSchema = z.object({
  file1: z.string(),
  file2: z.string(),
  format1: fileFormatSchema.optional(),
  format2: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type DiffOptions = z.infer<typeof diffOptionsSchema>;

export type DiffResult = {
  identical: boolean;
  metadataDiff?: Array<{
    field: string;
    file1Value: unknown;
    file2Value: unknown;
  }>;
  stepsDiff?: {
    file1Count: number;
    file2Count: number;
    differences: Array<{
      stepIndex: number;
      field: string;
      file1Value: unknown;
      file2Value: unknown;
    }>;
  };
  extensionsDiff?: {
    file1Keys: Array<string>;
    file2Keys: Array<string>;
    differences: Array<{
      key: string;
      file1Value: unknown;
      file2Value: unknown;
    }>;
  };
};
