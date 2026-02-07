/**
 * Re-exports for modular structure
 * Mappers have been split into separate files for better organization
 */

export {
  isOpenTarget,
  mapCadenceTargetToZwift,
  mapPaceTargetToZwift,
  mapPowerRangeToZwift,
  mapPowerTargetToZwift,
} from "./krd-to-zwift.mapper";

export {
  mapFreeRideToKrd,
  mapZwiftCadenceToKrd,
  mapZwiftPaceToKrd,
  mapZwiftPowerRangeToKrd,
  mapZwiftPowerToKrd,
} from "./zwift-to-krd.mapper";
