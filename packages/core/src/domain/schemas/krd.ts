/**
 * KRD Schema - Re-exports from modular structure
 *
 * This file maintains modular structure by re-exporting all KRD schemas
 * from their new modular locations in the krd/ subdirectory.
 */

export {
  type KRD,
  type KRDEvent,
  krdEventSchema,
  type KRDLap,
  krdLapSchema,
  type KRDMetadata,
  krdMetadataSchema,
  type KRDRecord,
  krdRecordSchema,
  krdSchema,
  type KRDSession,
  krdSessionSchema,
} from "./krd/index";
