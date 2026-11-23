import { useMemo } from "react";

import { createDexieUsageTelemetrySink } from "../adapters/telemetry/dexie-usage-telemetry-sink";
import { usePersistence } from "../contexts/persistence-context";
import type { GenerationDeps } from "../lib/generate-workout";
import { logger } from "../utils/logger";

/** The App's persistence and usage sink, for a workout generation. */
export const useGenerationDeps = (): GenerationDeps => {
  const persistence = usePersistence();
  return useMemo(
    () => ({
      persistence,
      usage: createDexieUsageTelemetrySink(persistence, logger),
    }),
    [persistence]
  );
};
