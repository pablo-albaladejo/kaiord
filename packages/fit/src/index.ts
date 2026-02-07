/**
 * @kaiord/fit - FIT format adapter for Kaiord
 *
 * Provides FIT file reading and writing capabilities using the Garmin FIT SDK.
 */

export { createFitProviders } from "./providers";
export type { FitProviders } from "./providers";

export {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "./adapters/garmin-fitsdk";
