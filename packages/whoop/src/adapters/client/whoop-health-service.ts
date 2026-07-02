import type { KRD, Logger } from "@kaiord/core";
import { createConsoleLogger, createServiceApiError } from "@kaiord/core";

import type { WhoopHttpClient } from "../http/types";
import { RECOVERY_PATH, SLEEP_PATH, type WhoopQuery } from "../http/urls";
import { whoopRecoveryRecordSchema } from "../schemas/whoop-recovery.schema";
import { whoopSleepRecordSchema } from "../schemas/whoop-sleep.schema";
import { buildRecoveryRhrIndex } from "./recovery-rhr-index";
import { recoveriesToKrds, sleepsToKrds } from "./whoop-health-mappers";
import { fetchAllRecords } from "./whoop-pagination";

export type WhoopHealthImport = {
  /** `hrv_summary` KRDs mapped from WHOOP recovery records. */
  recovery: KRD[];
  /** `sleep_record` KRDs mapped from WHOOP sleep activities. */
  sleep: KRD[];
  /** Flattened `[...recovery, ...sleep]` for bulk ingestion. */
  krds: KRD[];
};

export type WhoopHealthService = {
  importRecovery: (query?: WhoopQuery) => Promise<KRD[]>;
  importSleep: (
    query?: WhoopQuery,
    rhrBySleepId?: Map<string, number>
  ) => Promise<KRD[]>;
  importAll: (query?: WhoopQuery) => Promise<WhoopHealthImport>;
};

/**
 * Composition-edge service that turns WHOOP v2 read endpoints into health
 * KRDs, using the injected `WhoopHttpClient` (which owns OAuth, refresh-token
 * rotation and rate-limit back-off). Pure mapping lives in the converters.
 */
export const createWhoopHealthService = (
  httpClient: WhoopHttpClient,
  logger?: Logger
): WhoopHealthService => {
  const log = logger ?? createConsoleLogger();

  const fetchRecovery = (query?: WhoopQuery) =>
    fetchAllRecords(
      httpClient,
      RECOVERY_PATH,
      whoopRecoveryRecordSchema,
      query,
      (path) => log.warn(`WHOOP pagination truncated at MAX_PAGES for ${path}`)
    ).catch((error) => {
      throw createServiceApiError(
        "Failed to import WHOOP recovery",
        undefined,
        error
      );
    });

  const importRecovery = async (query?: WhoopQuery): Promise<KRD[]> => {
    log.info("Importing WHOOP recovery");
    return recoveriesToKrds(await fetchRecovery(query));
  };

  const importSleep = async (
    query?: WhoopQuery,
    rhrBySleepId?: Map<string, number>
  ): Promise<KRD[]> => {
    log.info("Importing WHOOP sleep");
    const records = await fetchAllRecords(
      httpClient,
      SLEEP_PATH,
      whoopSleepRecordSchema,
      query,
      (path) => log.warn(`WHOOP pagination truncated at MAX_PAGES for ${path}`)
    ).catch((error) => {
      throw createServiceApiError(
        "Failed to import WHOOP sleep",
        undefined,
        error
      );
    });
    return sleepsToKrds(records, rhrBySleepId);
  };

  const importAll = async (query?: WhoopQuery): Promise<WhoopHealthImport> => {
    const recoveryRecords = await fetchRecovery(query);
    const recovery = recoveriesToKrds(recoveryRecords);
    const sleep = await importSleep(
      query,
      buildRecoveryRhrIndex(recoveryRecords)
    );
    return { recovery, sleep, krds: [...recovery, ...sleep] };
  };

  return { importRecovery, importSleep, importAll };
};
