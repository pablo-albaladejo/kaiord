import type { Logger } from "@kaiord/core";

export const isLogger = (v: unknown): v is Logger =>
  v !== null &&
  typeof v === "object" &&
  typeof (v as Logger).info === "function";
