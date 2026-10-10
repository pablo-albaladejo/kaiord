/**
 * Pure row re-keying from one or more source profiles onto a target.
 *
 * A source row is every row whose `profileId` is a source id. Its
 * `profileId` is rewritten, and so is every top-level string that embeds a
 * source id as its `${profileId}:` prefix — composite ids such as
 * `coachingDayNotes` (`${profileId}:${source}:${date}`), `coachingActivities`,
 * `sessionMatches.coachingActivityId`, and `workouts.sourceId`. Source ids
 * are random UUIDs, so a prefix match cannot hit an unrelated value.
 * Collisions with rows already present follow the table's `RekeyRule`.
 */

import {
  AUTO_PROFILE_REKEY_RULES,
  type RekeyRule,
} from "./auto-profile-rekey-rules";
import { recordClock } from "./merge-record-key";

type Row = Record<string, unknown>;

export type ProfileRekey = { from: ReadonlyArray<string>; to: string };

const rekeyValue = (value: unknown, rekey: ProfileRekey): unknown => {
  if (typeof value !== "string") return value;
  for (const from of rekey.from) {
    if (value === from) return rekey.to;
    if (value.startsWith(`${from}:`))
      return rekey.to + value.slice(from.length);
  }
  return value;
};

export const rekeyRow = (row: Row, rekey: ProfileRekey): Row =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, rekeyValue(v, rekey)])
  );

const ownedBySource = (row: Row, rekey: ProfileRekey): boolean =>
  typeof row.profileId === "string" && rekey.from.includes(row.profileId);

const keyOf = (rule: RekeyRule, row: Row): string =>
  (rule.key ?? ["id"]).map((f) => String(row[f] ?? "")).join("\u0000");

const sourceWins = (rule: RekeyRule, incoming: Row, existing: Row): boolean => {
  if (rule.onCollision !== "lww") return false;
  const a = recordClock(incoming);
  const b = recordClock(existing);
  return a > 0 && b > 0 && a > b;
};

export function rekeyTableRows(
  table: string,
  rows: ReadonlyArray<unknown>,
  rekey: ProfileRekey
): Row[] {
  const rule = AUTO_PROFILE_REKEY_RULES[table] ?? { onCollision: "lww" };
  const all = rows as ReadonlyArray<Row>;
  const out = all.filter((r) => !ownedBySource(r, rekey));
  if (rule.onCollision === "drop") return out;
  const index = new Map(out.map((r, i) => [keyOf(rule, r), i]));
  for (const raw of all.filter((r) => ownedBySource(r, rekey))) {
    const row = rekeyRow(raw, rekey);
    const k = keyOf(rule, row);
    const at = index.get(k);
    const existing = at === undefined ? undefined : out[at];
    if (at === undefined || existing === undefined) {
      index.set(k, out.push(row) - 1);
    } else if (sourceWins(rule, row, existing)) {
      out[at] = row;
    }
  }
  return out;
}
