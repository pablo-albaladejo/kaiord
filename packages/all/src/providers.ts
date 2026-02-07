import type { Logger, Providers } from "@kaiord/core";
import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createTcxProviders } from "@kaiord/tcx";
import { createZwoProviders } from "@kaiord/zwo";

/**
 * Creates providers with all format adapters wired together.
 *
 * This is the backward-compatible replacement for the old
 * `createDefaultProviders()` from `@kaiord/core` v1.x.
 *
 * @param logger - Optional custom logger
 * @returns Providers with all adapters configured
 */
export const createAllProviders = (logger?: Logger): Providers => {
  return createDefaultProviders(
    {
      fit: createFitProviders(logger),
      tcx: createTcxProviders(logger),
      zwo: createZwoProviders(logger),
    },
    logger
  );
};
