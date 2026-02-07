// Re-export from split modules for backward compatibility
export {
  mapCadenceTargetToTcx,
  mapHeartRateTargetToTcx,
  mapOpenTargetToTcx,
  mapPaceTargetToTcx,
  mapTargetTypeToTcx,
} from "./krd-to-tcx.mapper";
export { convertTcxTarget, mapTargetType } from "./tcx-to-krd.mapper";
