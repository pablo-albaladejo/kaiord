// Re-export from split modules for modular structure
export type { KrdDurationConversionResult } from "./krd-to-tcx.converter";
export { convertKrdDurationToTcx } from "./krd-to-tcx.converter";
export type {
  TcxDurationConversionResult,
  TcxDurationData,
  TcxDurationExtensions,
} from "./tcx-to-krd.converter";
export { convertTcxDuration } from "./tcx-to-krd.converter";
