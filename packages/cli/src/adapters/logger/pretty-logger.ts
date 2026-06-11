import type { Logger } from "@kaiord/core";
import chalk from "chalk";

import { isTTY } from "../../utils/is-tty";
import type { LoggerOptions } from "../../utils/logger-factory";

const LOG_LEVELS = ["debug", "info", "warn", "error"];

type LogLevel = "debug" | "info" | "warn" | "error";

type LogConfig = {
  useColors: boolean;
  quiet: boolean;
  minLevelIndex: number;
};

type MethodDisplay = {
  prefix: string;
  colorFn: (s: string) => string;
  consoleFn: (s: string) => void;
};

const shouldLog = (cfg: LogConfig, messageLevel: string): boolean => {
  if (cfg.quiet && messageLevel !== "error") return false;
  return LOG_LEVELS.indexOf(messageLevel) >= cfg.minLevelIndex;
};

const formatContext = (
  useColors: boolean,
  context?: Record<string, unknown>
): string => {
  if (!context || Object.keys(context).length === 0) return "";
  const contextStr = JSON.stringify(context);
  return " " + (useColors ? chalk.gray(contextStr) : contextStr);
};

const makeLogMethod =
  (cfg: LogConfig, level: LogLevel, display: MethodDisplay) =>
  (message: string, context?: Record<string, unknown>): void => {
    if (!shouldLog(cfg, level)) return;
    const formatted = `${display.prefix} ${message}${formatContext(cfg.useColors, context)}`;
    display.consoleFn(cfg.useColors ? display.colorFn(formatted) : formatted);
  };

export const createPrettyLogger = (options: LoggerOptions = {}): Logger => {
  const level = options.level || "info";
  const cfg: LogConfig = {
    quiet: options.quiet || false,
    useColors: isTTY() || process.env.FORCE_COLOR === "1",
    minLevelIndex: LOG_LEVELS.indexOf(level),
  };

  return {
    debug: makeLogMethod(cfg, "debug", {
      prefix: "🐛",
      colorFn: chalk.gray,
      consoleFn: console.log,
    }),
    info: makeLogMethod(cfg, "info", {
      prefix: "ℹ",
      colorFn: chalk.blue,
      consoleFn: console.log,
    }),
    warn: makeLogMethod(cfg, "warn", {
      prefix: "⚠",
      colorFn: chalk.yellow,
      consoleFn: console.warn,
    }),
    error: makeLogMethod(cfg, "error", {
      prefix: "✖",
      colorFn: chalk.red,
      consoleFn: console.error,
    }),
  };
};
