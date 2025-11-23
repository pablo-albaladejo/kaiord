import type { Logger } from "@kaiord/core";
import chalk from "chalk";
import { isTTY } from "../../utils/is-tty";
import type { LoggerOptions } from "../../utils/logger-factory";

/**
 * Creates a pretty terminal logger with colors and emoji prefixes
 *
 * @param options - Logger configuration options
 * @returns Logger instance compatible with @kaiord/core
 */
export const createPrettyLogger = (options: LoggerOptions = {}): Logger => {
  const level = options.level || "info";
  const quiet = options.quiet || false;

  // Check if colors should be used:
  // - Use colors if in TTY
  // - OR if FORCE_COLOR is set (for testing)
  const forceColor = process.env.FORCE_COLOR === "1";
  const useColors = isTTY() || forceColor;

  // Define log level hierarchy
  const levels = ["debug", "info", "warn", "error"];
  const minLevelIndex = levels.indexOf(level);

  const shouldLog = (messageLevel: string): boolean => {
    if (quiet && messageLevel !== "error") {
      return false;
    }
    const messageLevelIndex = levels.indexOf(messageLevel);
    return messageLevelIndex >= minLevelIndex;
  };

  const formatContext = (context?: Record<string, unknown>): string => {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }
    const contextStr = JSON.stringify(context);
    return " " + (useColors ? chalk.gray(contextStr) : contextStr);
  };

  return {
    debug: (message: string, context?: Record<string, unknown>): void => {
      if (shouldLog("debug")) {
        const formatted = `🐛 ${message}${formatContext(context)}`;
        console.log(useColors ? chalk.gray(formatted) : formatted);
      }
    },

    info: (message: string, context?: Record<string, unknown>): void => {
      if (shouldLog("info")) {
        const formatted = `ℹ ${message}${formatContext(context)}`;
        console.log(useColors ? chalk.blue(formatted) : formatted);
      }
    },

    warn: (message: string, context?: Record<string, unknown>): void => {
      if (shouldLog("warn")) {
        const formatted = `⚠ ${message}${formatContext(context)}`;
        console.warn(useColors ? chalk.yellow(formatted) : formatted);
      }
    },

    error: (message: string, context?: Record<string, unknown>): void => {
      if (shouldLog("error")) {
        const formatted = `✖ ${message}${formatContext(context)}`;
        console.error(useColors ? chalk.red(formatted) : formatted);
      }
    },
  };
};
