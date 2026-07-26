import { Decoder, Encoder, Stream } from "@garmin/fitsdk";
import type { BodyComposition } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  mapFitBodyCompositionToKrd,
  mapKrdBodyCompositionToFit,
} from "./health-body-composition.converter";

/**
 * Byte-level scale probe for `basalMet` against the REAL @garmin/fitsdk
 * Encoder/Decoder.
 *
 * A pure in-memory KRD↔FIT round-trip is NOT sufficient to pin the scale:
 * a symmetric scale error (mapper multiplies by N, then divides by N) round-
 * trips clean while still corrupting the value on the wire. Only the SDK byte
 * path — which knows the profile scale — catches a wrong scale.
 *
 * The @garmin/fitsdk Profile (v21.208.0) has NO `body_composition` message
 * (mesgNum 41); the `basalMet` (scale 4, kcal/day) and `visceralFatRating`
 * (scale 1) fields live in `weight_scale` (mesgNum 30) with identical field
 * definitions. We therefore drive the SAME field definitions through the SDK
 * via a weight_scale message, feeding the mapper's output so a mapper scale
 * bug would surface here.
 */
const WEIGHT_SCALE_MESG_NUM = 30;
const MEASURED_AT = "2026-05-22T07:15:00.000Z";
const BASAL_MET_KCAL = 1500;
const VISCERAL_FAT_RATING = 12;
// The FIT profile scale for `basal_met` (kcal/day). Only used to construct a
// deliberately pre-scaled value that proves double-scaling corrupts BMR.
const BASAL_MET_PROFILE_SCALE = 4;
// Real kilograms for the weight/mass fields (FIT profile scale 100). The SDK
// auto-applies that scale on encode+decode, so the mappers must carry these
// as real kilograms too — a manual x100 overflows the uint16 raw and corrupts.
const WEIGHT_KG = 75.8;
const MUSCLE_MASS_KG = 58.2;
const BONE_MASS_KG = 3.4;
const KG_PROFILE_SCALE = 100;

const encodeDecodeWeightScale = (fields: {
  basalMet?: number;
  visceralFatRating?: number;
  weight?: number;
  muscleMass?: number;
  boneMass?: number;
}): {
  basalMet?: number;
  visceralFatRating?: number;
  weight?: number;
  muscleMass?: number;
  boneMass?: number;
} => {
  const encoder = new Encoder();
  // The SDK's writeMesg is typed against a fixed `Mesg` shape (mesgNum +
  // developerFields only); real FIT fields are passed as a loose record, as
  // the production writer does. Cast at the boundary to satisfy the types.
  const inputMesg: Record<string, unknown> = {
    mesgNum: WEIGHT_SCALE_MESG_NUM,
    timestamp: new Date(MEASURED_AT),
    ...fields,
  };
  encoder.writeMesg(
    inputMesg as unknown as Parameters<typeof encoder.writeMesg>[0]
  );
  const bytes = encoder.close();
  const decoder = new Decoder(Stream.fromByteArray(Array.from(bytes)));
  const { messages, errors } = decoder.read();
  expect(errors).toEqual([]);
  const decoded = (
    messages as { weightScaleMesgs?: Array<Record<string, number>> }
  ).weightScaleMesgs?.[0];
  if (!decoded) throw new Error("no weight_scale message decoded");
  return decoded;
};

describe("FIT field scaling through the real @garmin/fitsdk byte path", () => {
  it("should preserve REAL kcal through encode-decode, proving the SDK auto-applies scale 4", () => {
    // Arrange
    // The mapper output carries the real kcal (no manual scaling).
    const body: BodyComposition = {
      kind: "bodyComposition",
      version: "2.0",
      measuredAt: MEASURED_AT,
      basalMetabolicRateKcal: BASAL_MET_KCAL,
      visceralFatRating: VISCERAL_FAT_RATING,
    };
    const fit = mapKrdBodyCompositionToFit(body);
    expect(fit.basalMet).toBe(BASAL_MET_KCAL); // mapper does not scale

    // Act
    // Drive the mapper output through the real SDK byte path.
    const decoded = encodeDecodeWeightScale({
      basalMet: fit.basalMet,
      visceralFatRating: fit.visceralFatRating,
    });

    // Assert
    // The SDK returns the SAME real kcal (scale 4 applied internally), and the
    // integer rating survives unchanged. A mapper that pre-scaled by 4 would
    // decode 6000 here, not 1500. Map back to KRD to close the loop.
    expect(decoded.basalMet).toBe(BASAL_MET_KCAL);
    expect(decoded.visceralFatRating).toBe(VISCERAL_FAT_RATING);
    const replayed = mapFitBodyCompositionToKrd({
      timestamp: new Date(MEASURED_AT),
      basalMet: decoded.basalMet,
      visceralFatRating: decoded.visceralFatRating,
    });
    expect(replayed?.basalMetabolicRateKcal).toBe(BASAL_MET_KCAL);
    expect(replayed?.visceralFatRating).toBe(VISCERAL_FAT_RATING);
  });

  it("should decode a wrong value when fed a pre-scaled raw basalMet, guarding the mapper no-scale contract", () => {
    // Arrange
    // Feeding a value pre-multiplied by the profile scale makes the SDK apply
    // the scale a SECOND time, so the decoded real value is wrong — the exact
    // corruption the mapper avoids by passing real kcal through.
    const preScaled = BASAL_MET_KCAL * BASAL_MET_PROFILE_SCALE;

    // Act
    const decoded = encodeDecodeWeightScale({ basalMet: preScaled });

    // Assert
    expect(decoded.basalMet).not.toBe(BASAL_MET_KCAL);
    expect(decoded.basalMet).toBe(preScaled);
  });

  it("should preserve REAL kilograms for weight, muscle and bone mass, proving the SDK auto-applies scale 100", () => {
    // Arrange
    // The body-composition mapper carries real kg (no manual x100 scaling).
    const body: BodyComposition = {
      kind: "bodyComposition",
      version: "2.0",
      measuredAt: MEASURED_AT,
      leanMassKilograms: MUSCLE_MASS_KG,
      boneMassKilograms: BONE_MASS_KG,
    };
    const fit = mapKrdBodyCompositionToFit(body);
    expect(fit.muscleMass).toBe(MUSCLE_MASS_KG);
    expect(fit.boneMass).toBe(BONE_MASS_KG);

    // Act
    // Drive real kilograms (weight + the mapper's mass output) through the
    // real SDK byte path.
    const decoded = encodeDecodeWeightScale({
      weight: WEIGHT_KG,
      muscleMass: fit.muscleMass,
      boneMass: fit.boneMass,
    });

    // Assert
    // Real kilograms survive unchanged; the SDK applied scale 100 internally.
    // Close the loop back to KRD to confirm the inverse mapper.
    expect(decoded.weight).toBe(WEIGHT_KG);
    expect(decoded.muscleMass).toBe(MUSCLE_MASS_KG);
    expect(decoded.boneMass).toBe(BONE_MASS_KG);
    const replayed = mapFitBodyCompositionToKrd({
      timestamp: new Date(MEASURED_AT),
      muscleMass: decoded.muscleMass,
      boneMass: decoded.boneMass,
    });
    expect(replayed?.leanMassKilograms).toBe(MUSCLE_MASS_KG);
    expect(replayed?.boneMassKilograms).toBe(BONE_MASS_KG);
  });

  it("should decode a corrupted mass when fed pre-scaled raw kilograms, guarding the no-scale contract", () => {
    // Arrange
    // Pre-multiplying by the profile scale overflows the uint16 raw on encode.
    const preScaledMuscle = MUSCLE_MASS_KG * KG_PROFILE_SCALE;

    // Act
    const decoded = encodeDecodeWeightScale({ muscleMass: preScaledMuscle });

    // Assert
    expect(decoded.muscleMass).not.toBe(MUSCLE_MASS_KG);
  });
});
