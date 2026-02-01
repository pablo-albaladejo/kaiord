import { z } from "zod";
import { fileFormatSchema } from "../../utils/format-detector";

export const convertOptionsSchema = z.object({
  input: z.string(),
  output: z.string().optional(),
  outputDir: z.string().optional(),
  inputFormat: fileFormatSchema.optional(),
  outputFormat: fileFormatSchema.optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type ConvertOptions = z.infer<typeof convertOptionsSchema>;

export type ConversionResult = {
  success: boolean;
  inputFile: string;
  outputFile?: string;
  error?: string;
};

export type ValidatedConvertOptions = z.infer<typeof convertOptionsSchema>;
