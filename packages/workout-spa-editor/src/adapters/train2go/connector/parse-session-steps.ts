/**
 * A session's structured steps, read from the steps grid in its daily
 * block: rows of duration, zone, power (W), heart rate (bpm) and repeat
 * count. A repeat cell spanning N rows (`grid-row: span N`) covers the work
 * row and the N-1 recovery rows under it.
 *
 * Fails closed: with no grid, or with any cell it cannot read, it returns
 * `undefined` and the session is converted the way it was before, never
 * from a half-read table.
 */
import type {
  CoachingStepGroup,
  CoachingStructuredStep,
} from "../../../types/coaching-structured-steps";
import {
  readBpm,
  readDurationSeconds,
  readRepeat,
  readWatts,
  readZoneLabel,
} from "./steps-cell-values";
import { type CellKind, type ReadCell,readCell } from "./steps-grid-cell-kind";
import { readGridCells } from "./steps-grid-cells";

const ROW: readonly CellKind[] = ["duration", "zone", "power", "hr"];

const readRow = (
  cells: ReadCell[],
  at: number,
  recovery: boolean
): CoachingStructuredStep | undefined => {
  const row = cells.slice(at, at + ROW.length);
  const fits = (c: ReadCell, i: number) =>
    c.kind === ROW[i] && c.recovery === recovery;
  if (row.length < ROW.length || !row.every(fits)) return undefined;
  const [duration, zone, power, hr] = row.map((c) => c.text);
  const step = {
    durationSeconds: readDurationSeconds(duration ?? ""),
    zone: readZoneLabel(zone ?? ""),
    powerWatts: readWatts(power ?? ""),
    heartRateBpm: readBpm(hr ?? ""),
  };
  return Object.values(step).every((v) => v !== undefined)
    ? (step as CoachingStructuredStep)
    : undefined;
};

const readGroup = (
  cells: ReadCell[],
  at: number
): { group: CoachingStepGroup; next: number } | undefined => {
  const work = readRow(cells, at, false);
  const repeatCell = cells[at + ROW.length];
  if (!work || repeatCell?.kind !== "repeat" || repeatCell.recovery) return;
  const repeat = readRepeat(repeatCell.text);
  if (!repeat) return undefined;
  const steps = [work];
  let next = at + ROW.length + 1;
  for (let i = 1; i < repeatCell.span; i++) {
    const recovery = readRow(cells, next, true);
    if (!recovery) return undefined;
    steps.push(recovery);
    next += ROW.length;
  }
  return { group: { repeat, steps }, next };
};

export const parseSessionSteps = (
  html: string
): CoachingStepGroup[] | undefined => {
  const cells = readGridCells(html)?.map(readCell);
  if (!cells?.length || cells.some((c) => !c)) return undefined;
  const read = cells as ReadCell[];
  const groups: CoachingStepGroup[] = [];
  for (let at = 0; at < read.length;) {
    const g = readGroup(read, at);
    if (!g) return undefined;
    groups.push(g.group);
    at = g.next;
  }
  return groups;
};
