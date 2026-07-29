import { readTanitaExportCsv } from "../../adapters/tanita/tanita-transport";
import { syncTanitaImport } from "../../application/tanita/sync-tanita-import.use-case";
import type { PersistencePort } from "../../ports/persistence-port";

export const runTanitaImport = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  const { tanitaCsvToKrd } = await import("@kaiord/tanita");
  await syncTanitaImport(
    {
      policyRepo: persistence.integrationPolicy,
      importedRecords: persistence.importedRecords,
      readCsv: () => readTanitaExportCsv(extensionId),
      parse: tanitaCsvToKrd,
      coachingSyncState: persistence.coachingSyncState,
    },
    { profileId }
  );
};
