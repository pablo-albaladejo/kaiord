/**
 * Target Values - Re-exports from modular structure
 *
 * This file maintains modular structure by re-exporting all target value schemas
 * from their new modular locations in the target-values/ subdirectory.
 */

export {
  cadenceValueSchema,
  heartRateValueSchema,
  paceValueSchema,
  powerValueSchema,
  strokeTypeValueSchema,
  targetUnitSchema,
  type CadenceValue,
  type HeartRateValue,
  type PaceValue,
  type PowerValue,
  type StrokeTypeValue,
  type TargetUnit,
} from "./target-values/index";
