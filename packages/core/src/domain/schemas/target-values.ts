/**
 * Target Values - Re-exports from modular structure
 *
 * This file maintains modular structure by re-exporting all target value schemas
 * from their new modular locations in the target-values/ subdirectory.
 */

export {
  type CadenceValue,
  cadenceValueSchema,
  type HeartRateValue,
  heartRateValueSchema,
  type PaceValue,
  paceValueSchema,
  type PowerValue,
  powerValueSchema,
  type StrokeTypeValue,
  strokeTypeValueSchema,
  type TargetUnit,
  targetUnitSchema,
} from "./target-values/index";
