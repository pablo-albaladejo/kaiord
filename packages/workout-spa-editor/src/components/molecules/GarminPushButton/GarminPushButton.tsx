import { useLiveQuery } from "dexie-react-hooks";
import { Upload } from "lucide-react";
import { useParams } from "wouter";

import { db } from "../../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../../adapters/dexie/dexie-integration-policy-repository";
import { resolveExportPolicies } from "../../../application/integration-policy/resolve-export-policies.use-case";
import { useGarminBridge } from "../../../contexts";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button } from "../../atoms/Button";
import { GarminExportDisabledButton } from "./GarminExportDisabledButton";
import { GarminNoSessionButton } from "./GarminNoSessionButton";
import { PushFeedback } from "./PushFeedback";
import { useGarminPush } from "./useGarminPush";

const policyRepo = createDexieIntegrationPolicyRepository(db);
const GARMIN_BRIDGE_ID = "garmin-bridge";

export const GarminPushButton: React.FC<{ profileId?: string }> = ({
  profileId,
}) => {
  const { extensionInstalled, sessionActive, pushing, setPushing } =
    useGarminBridge();
  const { id } = useParams<{ id?: string }>();
  const workout = useLiveQuery(
    () => (id ? db.table<WorkoutRecord>("workouts").get(id) : undefined),
    [id]
  );
  const exportPolicies = useLiveQuery(
    () =>
      profileId
        ? resolveExportPolicies(
            { policyRepo },
            { profileId, dataType: "workout" }
          )
        : Promise.resolve([]),
    [profileId]
  );
  const { push } = useGarminPush(workout);
  const isLoading = pushing.status === "loading";

  const hasEnabledPolicy =
    Array.isArray(exportPolicies) &&
    exportPolicies.some((p) => p.enabled && p.bridgeId === GARMIN_BRIDGE_ID);

  if (!extensionInstalled) {
    return null;
  }

  if (!hasEnabledPolicy) {
    return <GarminExportDisabledButton />;
  }

  if (!sessionActive) {
    return (
      <GarminNoSessionButton
        pushing={pushing}
        onReset={() => setPushing({ status: "idle" })}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={push}
        loading={isLoading}
        disabled={isLoading}
      >
        <Upload className="h-4 w-4" />
        Send to Garmin
      </Button>
      <PushFeedback
        push={pushing}
        onReset={() => setPushing({ status: "idle" })}
      />
    </div>
  );
};
