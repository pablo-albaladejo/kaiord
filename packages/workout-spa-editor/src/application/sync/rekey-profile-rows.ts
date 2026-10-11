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

const primaryKey = (rule: RekeyRule): ReadonlyArray<string> =>
  rule.key ?? ["id"];

/** Every unique key the row carries, tagged by key so two never alias. */
const keysOf = (rule: RekeyRule, row: Row): string[] => {
  const primary = primaryKey(rule).map((f) => String(row[f] ?? ""));
  const natural = (rule.uniqueKeys ?? [])
    .filter((fields) => fields.every((f) => row[f] != null && row[f] !== ""))
    .map(
      (fields, i) =>
        `${i + 1}\u0001${fields.map((f) => String(row[f])).join("\u0000")}`
    );
  return [`0\u0001${primary.join("\u0000")}`, ...natural];
};

const sourceWins = (rule: RekeyRule, incoming: Row, existing: Row): boolean => {
  if (rule.onCollision !== "lww") return false;
  const a = recordClock(incoming);
  const b = recordClock(existing);
  return a > 0 && b > 0 && a > b;
};

/** The winning auto row takes the target row's identity, so it updates it. */
const asTarget = (rule: RekeyRule, row: Row, existing: Row): Row => ({
  ...row,
  ...Object.fromEntries(primaryKey(rule).map((f) => [f, existing[f]])),
});

export function rekeyTableRows(
  table: string,
  rows: ReadonlyArray<unknown>,
  rekey: ProfileRekey
): Row[] {
  const rule = AUTO_PROFILE_REKEY_RULES[table] ?? { onCollision: "lww" };
  const all = rows as ReadonlyArray<Row>;
  const out = all.filter((r) => !ownedBySource(r, rekey));
  if (rule.onCollision === "drop") return out;
  const index = new Map<string, number>();
  const indexRow = (at: number) => {
    for (const k of keysOf(rule, out[at] as Row)) index.set(k, at);
  };
  out.forEach((_, at) => indexRow(at));
  for (const raw of all.filter((r) => ownedBySource(r, rekey))) {
    const row = rekeyRow(raw, rekey);
    const hits = new Set(keysOf(rule, row).flatMap((k) => index.get(k) ?? []));
    if (hits.size === 0) {
      indexRow(out.push(row) - 1);
      continue;
    }
    const [at] = [...hits];
    const existing = at === undefined ? undefined : out[at];
    if (hits.size > 1 || at === undefined || existing === undefined) continue;
    if (!sourceWins(rule, row, existing)) continue;
    for (const k of keysOf(rule, existing)) index.delete(k);
    out[at] = asTarget(rule, row, existing);
    indexRow(at);
  }
  return out;
}
