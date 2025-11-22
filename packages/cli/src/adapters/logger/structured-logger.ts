import type { Logger } from "@kaiord/core";
import winston from "winston";
import type { LoggerOptions } from "../../utils/logger-factory";

/**
 * Creates a structured JSON logger using winston
 *
 * @param options - Logger configuration options
 * @returns Logger instance compatible with @kaiord/core
 */
export const createStructuredLogger = (options: LoggerOptions = {}): Logger => {
  const level = options.level || "info";
  const quiet = options.quiet || false;

  // Create winston logger with JSON format
  const winstonLogger = winston.createLogger({
    level: quiet ? "error" : level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        stderrLevels: ["error", "warn", "info", "debug"],
      }),
    ],
  });

  return {
    debug: (message: string, context?: Record<string, unknown>): void => {
      winstonLogger.debug(message, context);
    },

    info: (message: string, context?: Record<string, unknown>): void => {
      winstonLogger.info(message, context);
    },

    warn: (message: string, context?: Record<string, unknown>): void => {
      winstonLogger.warn(message, context);
    },

    error: (message: string, context?: Record<string, unknown>): void => {
      winstonLogger.error(message, context);
    },
  };
};
