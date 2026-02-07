/**
 * @kaiord/all - Meta-package with all format adapters
 *
 * Provides backward compatibility by including all format adapters
 * (FIT, TCX, ZWO) and re-exporting everything from @kaiord/core.
 *
 * @example
 * ```typescript
 * import { createAllProviders } from '@kaiord/all';
 *
 * const providers = createAllProviders();
 * const krd = await providers.convertFitToKrd!({ fitBuffer });
 * ```
 */

// Re-export everything from core
export * from "@kaiord/core";

// Re-export adapter factories
export { createFitProviders } from "@kaiord/fit";
export type { FitProviders } from "@kaiord/fit";

export { createTcxProviders } from "@kaiord/tcx";
export type { TcxProviders } from "@kaiord/tcx";

export { createZwoProviders } from "@kaiord/zwo";
export type { ZwoProviders } from "@kaiord/zwo";

// Re-export adapter implementations for direct access
export {
  createGarminFitSdkReader,
  createGarminFitSdkWriter,
} from "@kaiord/fit";

export {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
  createXsdTcxValidator,
} from "@kaiord/tcx";

export {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
  createZwiftValidator,
  createXsdZwiftValidator,
} from "@kaiord/zwo";

export { createAllProviders } from "./providers";
