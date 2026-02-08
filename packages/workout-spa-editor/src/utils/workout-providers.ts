/**
 * Shared workout providers instance
 *
 * Creates providers once for all import/export operations.
 */

import { createDefaultProviders } from "@kaiord/core";
import { createFitProviders } from "@kaiord/fit";
import { createGarminProviders } from "@kaiord/garmin";
import { createTcxProviders } from "@kaiord/tcx";
import { createZwoProviders } from "@kaiord/zwo";

export const providers = createDefaultProviders({
  fit: createFitProviders(),
  garmin: createGarminProviders(),
  tcx: createTcxProviders(),
  zwo: createZwoProviders(),
});
