/**
 * @kaiord/garmin - Garmin Connect API (GCN) format adapter for Kaiord
 *
 * Provides Garmin Connect JSON workout reading and writing capabilities.
 */

export { createGarminProviders } from "./providers";
export type { GarminProviders } from "./providers";

export { createGarminReader } from "./adapters/garmin-reader";
export { createGarminWriter } from "./adapters/garmin-writer";
