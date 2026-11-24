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

/**
 * The entry Kaiord for Garmin regains when the owner turns
 * `GARMIN_LIBRARY_DELETES` on (design "Library deletes off until the
 * owner's capture, 2026-11-24"): one library workout by canonical id, no
 * body. Today's `ALLOWED` does not hold it; the fake extension adds it so
 * the library-delete tests keep proving the behaviour for that day.
 */
export const GARMIN_LIBRARY_DELETE_ENTRY: ClosedEntry = {
  method: "DELETE",
  pattern: /^\/workout-service\/workout\/[1-9]\d*$/,
};
