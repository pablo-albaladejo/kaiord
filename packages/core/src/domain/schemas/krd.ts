/**
 * KRD Schema - Re-exports from modular structure
 *
 * This file maintains backward compatibility by re-exporting all KRD schemas
 * from their new modular locations in the krd/ subdirectory.
 */

export {
  krdEventSchema,
  krdLapSchema,
  krdMetadataSchema,
  krdRecordSchema,
  krdSchema,
  krdSessionSchema,
  type KRD,
  type KRDEvent,
  type KRDLap,
  type KRDMetadata,
  type KRDRecord,
  type KRDSession,
} from "./krd/index";
