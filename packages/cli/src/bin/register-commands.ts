import type { Argv } from "yargs";
import { convertYargsConfig } from "../commands/convert/yargs-config.js";
import { diffYargsConfig } from "../commands/diff/yargs-config.js";
import { extractWorkoutYargsConfig } from "../commands/extract-workout/yargs-config.js";
import { garminYargsConfig } from "../commands/garmin/yargs-config.js";
import { inspectYargsConfig } from "../commands/inspect/yargs-config.js";
import { validateYargsConfig } from "../commands/validate/yargs-config.js";

type YargsConfig = {
  command: string;
  describe: string;
  builder: (yargs: Argv) => Argv;
  handler: (argv: Record<string, unknown>) => void | Promise<void>;
};

const commands: YargsConfig[] = [
  convertYargsConfig,
  validateYargsConfig,
  diffYargsConfig,
  inspectYargsConfig,
  extractWorkoutYargsConfig,
  garminYargsConfig,
];

export const registerCommands = (yargs: Argv): Argv => {
  for (const cfg of commands) {
    yargs = yargs.command(cfg.command, cfg.describe, cfg.builder, cfg.handler);
  }
  return yargs;
};
