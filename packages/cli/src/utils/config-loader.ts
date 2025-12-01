import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { z } from "zod";
import { fileFormatSchema } from "./format-detector.js";

/**
 * Configuration schema for .kaiordrc.json
 */
export const configSchema = z.object({
  // Default formats
  defaultInputFormat: fileFormatSchema.optional(),
  defaultOutputFormat: fileFormatSchema.optional(),

  // Default directories
  defaultOutputDir: z.string().optional(),

  // Default tolerance config path
  defaultToleranceConfig: z.string().optional(),

  // Default logging options
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
  json: z.boolean().optional(),
  logFormat: z.enum(["pretty", "structured"]).optional(),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load configuration from .kaiordrc.json
 * Searches in the following order:
 * 1. Current working directory
 * 2. User home directory
 * 3. Returns empty config if not found
 */
export const loadConfig = async (): Promise<Config> => {
  const configPaths = [
    join(process.cwd(), ".kaiordrc.json"),
    join(homedir(), ".kaiordrc.json"),
  ];

  for (const configPath of configPaths) {
    try {
      const configContent = await readFile(configPath, "utf-8");
      const configJson = JSON.parse(configContent);
      const config = configSchema.parse(configJson);
      return config;
    } catch (error) {
      // Config file not found or invalid, try next location
      continue;
    }
  }

  // No config file found, return empty config
  return {};
};

/**
 * Merge CLI options with config file defaults
 * CLI options take precedence over config file
 */
export const mergeWithConfig = <T extends Record<string, unknown>>(
  cliOptions: T,
  config: Config
): T => {
  // Start with config defaults
  const merged: Record<string, unknown> = { ...config };

  // Override with CLI options, but skip undefined values
  for (const key in cliOptions) {
    if (cliOptions[key] !== undefined) {
      merged[key] = cliOptions[key];
    }
  }

  return merged as T;
};
