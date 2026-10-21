/**
 * Shared contract for every chat read tool.
 *
 * - Input: zod, with `dateFrom`/`dateTo` real `YYYY-MM-DD` dates; closed domains
 *   are enums, and every field carries a `.describe()`.
 * - Scope: `read` receives readers already bound to the active profile; it
 *   never sees the persistence port or the profile id.
 * - Output: `read` returns an explicit projection (never a raw payload);
 *   the range actually queried is always echoed as `range_used`, and the
 *   rows are held to a row AND serialized-byte budget with a
 *   `truncated`/`omitted` marker.
 * - Identity: each tool file writes its own `name`/`description` literals
 *   after the spread body.
 * - Every tool still needs its entry in `scripts/model-facing-sinks.mjs`,
 *   and externally-authored text in a row goes through `fenceUntrusted`.
 */
import type { ChatTool } from "@kaiord/ai";
import { z } from "zod";

import type { ReadToolDeps } from "./chat-tool-deps";
import { clampRange, type DateRange } from "./clamp-range";
import { bindProfileReaders, type ProfileReaders } from "./profile-readers";
import { applyReadBudget, DEFAULT_MAX_BYTES } from "./read-budget";

/** A real calendar date as `YYYY-MM-DD`; `2026-02-30` is rejected too. */
export const isoDate = () => z.iso.date("Expected a date as YYYY-MM-DD");

const DATE_RANGE_SHAPE = {
  dateFrom: isoDate().optional().describe("First day of the range, YYYY-MM-DD"),
  dateTo: isoDate()
    .optional()
    .describe("Last day of the range, YYYY-MM-DD; defaults to today"),
};

// Parsed on its own so the range is typed without the spec's generic shape.
const dateRangeSchema = z.object(DATE_RANGE_SHAPE);

export type ReadOutput<Row> = {
  /** Projected rows, sorted oldest first. */
  rows: Row[];
  /** Aggregates computed over every row, before the budget cuts any. */
  summary?: Record<string, unknown>;
};

export type ReadToolSpec<S extends z.ZodRawShape, Row> = {
  input: S;
  /** Key the budgeted rows are returned under. */
  rowsKey: string;
  maxRows: number;
  maxBytes?: number;
  read: (
    readers: ProfileReaders,
    input: z.infer<z.ZodObject<typeof DATE_RANGE_SHAPE & S>>,
    range: DateRange
  ) => Promise<ReadOutput<Row>>;
};

/**
 * Everything but the tool's identity: each tool file spreads this first, then
 * writes its own `name` and `description` literals, so the literals win and
 * stay visible to the guards.
 */
export type ReadToolBody = Omit<ChatTool, "name" | "description">;

export const defineReadTool =
  <S extends z.ZodRawShape, Row>(spec: ReadToolSpec<S, Row>) =>
  (deps: ReadToolDeps): ReadToolBody => {
    const inputSchema = z.object({ ...DATE_RANGE_SHAPE, ...spec.input });
    return {
      inputSchema,
      requiresConfirmation: false,
      execute: async (raw) => {
        const input = inputSchema.parse(raw);
        const range = clampRange(dateRangeSchema.parse(raw), deps.today);
        const readers = bindProfileReaders(deps.persistence, deps.profileId);
        const { rows, summary } = await spec.read(readers, input, range);
        return applyReadBudget(
          { range_used: range, ...summary },
          spec.rowsKey,
          rows,
          {
            maxRows: spec.maxRows,
            maxBytes: spec.maxBytes ?? DEFAULT_MAX_BYTES,
          }
        );
      },
    };
  };
