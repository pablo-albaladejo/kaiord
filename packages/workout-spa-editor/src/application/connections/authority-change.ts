/**
 * When a Platform the athlete connects starts deciding a kind another
 * Platform was already deciding, the App says so once (ADR 0003: decide and
 * offer undo). `seen` is what the athlete already knows, per kind: every
 * Platform that has decided it, the one deciding now last. A Platform new to
 * that list, with another before it, is news; a kind's first Platform, one
 * that decided before (back after a disconnect) and one the athlete chose in
 * the matrix are not, and are only remembered. Kinds that keep every source
 * have nothing to say.
 */
import type { ManagedDataType } from "@kaiord/core";

import { hasAutomaticAuthority } from "../data-source-policy/automatic-authority";
import type { DataTypeRoutingRow, RoutingOrigin } from "./data-type-routing";
import { MANUAL_SOURCE_ID } from "./data-type-sources";

export type AuthorityDeciders = Readonly<Record<string, readonly string[]>>;

export type AuthorityChangeNotice = {
  readonly decides: string;
  readonly replaces: string;
  readonly dataTypes: readonly ManagedDataType[];
};

export type AuthorityChanges = {
  readonly notices: readonly AuthorityChangeNotice[];
  readonly seen: Record<string, string[]>;
  readonly changed: boolean;
};

const decider = (origin: RoutingOrigin): string | undefined =>
  origin.kind === "only" ||
  origin.kind === "automatic" ||
  origin.kind === "primary"
    ? origin.sourceId
    : undefined;

const isNews = (origin: RoutingOrigin, known: readonly string[], id: string) =>
  origin.kind !== "primary" && known.length > 0 && !known.includes(id);

const addNotice = (
  notices: AuthorityChangeNotice[],
  decides: string,
  replaces: string,
  dataType: ManagedDataType
): void => {
  const same = notices.findIndex(
    (n) => n.decides === decides && n.replaces === replaces
  );
  const dataTypes = [...(notices[same]?.dataTypes ?? []), dataType];
  if (same === -1) notices.push({ decides, replaces, dataTypes });
  else notices[same] = { decides, replaces, dataTypes };
};

export const authorityChanges = (
  rows: readonly DataTypeRoutingRow[],
  seen: AuthorityDeciders
): AuthorityChanges => {
  const next: Record<string, string[]> = Object.fromEntries(
    Object.entries(seen).map(([kind, ids]) => [kind, [...ids]])
  );
  const notices: AuthorityChangeNotice[] = [];
  let changed = false;
  for (const { dataType, origin } of rows) {
    const id = decider(origin);
    if (!hasAutomaticAuthority(dataType) || id === undefined) continue;
    if (id === MANUAL_SOURCE_ID) continue;
    const known = seen[dataType] ?? [];
    if (known.at(-1) === id) continue;
    const replaces = known.at(-1);
    if (replaces !== undefined && isNews(origin, known, id)) {
      addNotice(notices, id, replaces, dataType);
    }
    next[dataType] = [...known.filter((k) => k !== id), id];
    changed = true;
  }
  return { notices, seen: next, changed };
};
