/**
 * `FieldKey` ↔ `Profile` field accessors. Routes to threshold-scalar
 * helpers (`sync-zones-threshold-fields.ts`) or band-level helpers
 * (`sync-zones-band-fields.ts`/`sync-zones-band-writes.ts`) based on
 * the FieldKey shape.
 */
import type { FieldKey, ThresholdFieldKey } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";
import {
  readHrBand,
  readPaceBand,
  readPowerBand,
} from "./sync-zones-band-fields";
import type { ParsedBandKey } from "./sync-zones-band-key";
import { parseBandKey } from "./sync-zones-band-key";
import {
  writeHrBand,
  writePaceBand,
  writePowerBand,
} from "./sync-zones-band-writes";
import { readThreshold, writeThreshold } from "./sync-zones-threshold-fields";

const readBandField = (
  profile: Profile,
  parsed: NonNullable<ParsedBandKey>
): number | undefined => {
  if (parsed.kind === "hr") {
    return readHrBand(profile, parsed.sport, parsed.band, parsed.bound);
  }
  if (parsed.kind === "power") {
    return readPowerBand(profile, parsed.band, parsed.bound);
  }
  return readPaceBand(profile, parsed.sport, parsed.band, parsed.bound);
};

const writeBandField = (
  profile: Profile,
  parsed: NonNullable<ParsedBandKey>,
  value: number
): Profile => {
  if (parsed.kind === "hr") {
    return writeHrBand(profile, parsed.sport, parsed.band, parsed.bound, value);
  }
  if (parsed.kind === "power") {
    return writePowerBand(profile, parsed.band, parsed.bound, value);
  }
  return writePaceBand(profile, parsed.sport, parsed.band, parsed.bound, value);
};

export const readField = (
  profile: Profile,
  field: FieldKey
): number | undefined => {
  const parsed = parseBandKey(field);
  if (parsed) return readBandField(profile, parsed);
  return readThreshold(profile, field as ThresholdFieldKey);
};

export const writeField = (
  profile: Profile,
  field: FieldKey,
  value: number
): Profile => {
  const parsed = parseBandKey(field);
  if (parsed) return writeBandField(profile, parsed, value);
  return writeThreshold(profile, field as ThresholdFieldKey, value);
};
