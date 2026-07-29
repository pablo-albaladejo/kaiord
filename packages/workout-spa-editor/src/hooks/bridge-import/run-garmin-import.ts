import { readGarminActivities } from "../../adapters/garmin/garmin-activities-transport";
import { pullGarminActivities } from "../../application/import/pull-garmin-activities.use-case";
import type { PersistencePort } from "../../ports/persistence-port";

export const runGarminImport = async (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
): Promise<void> => {
  await pullGarminActivities(
    {
      policyRepo: persistence.integrationPolicy,
      activities: persistence.activities,
      coachingSyncState: persistence.coachingSyncState,
      readActivities: () => readGarminActivities(extensionId),
    },
    profileId
  );
};
