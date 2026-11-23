/**
 * A bridge's closed list, read from its background.js `ALLOWED` (one entry
 * per physical line, as scripts/check-bridge-privacy-surface.mjs requires),
 * so a Connector's path builders are checked against the real list.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ClosedEntry = { method: string; pattern: RegExp; body?: string };

const ENTRY =
  /\{ method: "([A-Z]+)", pattern: \/(.*)\/(?:, body: "([a-z-]+)")? \},?$/;

export const closedListOf = (bridge: string): ClosedEntry[] =>
  readFileSync(join(__dirname, "../../..", bridge, "background.js"), "utf-8")
    .split("\n")
    .map((line) => ENTRY.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map(([, method, source, body]) => ({
      method: method ?? "",
      pattern: new RegExp(source ?? ""),
      ...(body ? { body } : {}),
    }));

export const isListed = (
  list: readonly ClosedEntry[],
  method: string,
  path: string
): boolean => list.some((e) => e.method === method && e.pattern.test(path));
