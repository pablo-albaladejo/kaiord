import type { Logger } from "@kaiord/core";

export const isLogger = (value: unknown): value is Logger =>
  value !== null &&
  typeof value === "object" &&
  typeof (value as Logger).info === "function";
