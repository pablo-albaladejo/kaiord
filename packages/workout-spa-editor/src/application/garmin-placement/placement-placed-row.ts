/**
 * The row a new `Placed` is written into: its own entry, a superseded
 * `scheduled` previous retired, and any other entry a recognition raises.
 */
import type { GarminPlaced } from "../../types/garmin-ledger";
import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { entryOf } from "../sync/merge-garmin-removal-queue";
import { type Row, samePlaced, withEntries } from "./placement-row";

/** A superseded `scheduled` previous is retired with the new `Placed`. */
export const retiredBy = (
  previous: GarminPlaced | undefined,
  placed: GarminPlaced
): GarminRemovalEntry[] =>
  previous?.kind === "scheduled" &&
  !(placed.kind === "scheduled" && samePlaced(previous, placed))
    ? [entryOf(previous, "retire")]
    : [];

/** What a recognition writes beside the `Placed`: its own entry (a
    revived, `created` or `recognised` one) and other entries to raise. */
export type PlacedEntries = {
  own?: GarminRemovalEntry;
  extra?: GarminRemovalEntry[];
};

/** A new `Placed` with its id `keep` (or `entries.own`), a superseded
    previous `retire`, and `entries.extra`. */
export const placedRow = (
  row: Row,
  placed: GarminPlaced,
  previous: GarminPlaced | undefined,
  entries: PlacedEntries = {}
): Row =>
  withEntries({ ...row, placement: placed }, [
    ...(placed.kind === "scheduled"
      ? [entries.own ?? entryOf(placed, "keep")]
      : []),
    ...retiredBy(previous, placed),
    ...(entries.extra ?? []),
  ]);

/** The entry of a `Placed` a POST of Kaiord made. */
export const createdBy = (placed: GarminPlaced): PlacedEntries =>
  placed.kind === "scheduled"
    ? { own: { ...entryOf(placed, "keep"), created: true } }
    : {};

/** The entry of a `Placed` Kaiord found without having posted it. */
export const recognisedBy = (placed: GarminPlaced): PlacedEntries =>
  placed.kind === "scheduled"
    ? { own: { ...entryOf(placed, "keep"), recognised: true } }
    : {};
