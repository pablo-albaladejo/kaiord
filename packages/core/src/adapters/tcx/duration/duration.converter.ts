// Re-export from split modules for backward compatibility
export { convertTcxDuration } from "./tcx-to-krd.converter";
export type {
  TcxDurationConversionResult,
  TcxDurationData,
  TcxDurationExtensions,
} from "./tcx-to-krd.converter";

export { convertKrdDurationToTcx } from "./krd-to-tcx.converter";
export type { KrdDurationConversionResult } from "./krd-to-tcx.converter";
