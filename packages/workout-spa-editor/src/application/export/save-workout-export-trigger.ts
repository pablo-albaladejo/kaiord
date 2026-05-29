/**
 * save-workout export trigger — subscribes to `entitySaved` events and
 * fires `recordExport` for every enabled mode='auto' export policy.
 *
 * Wire-up: call `registerSaveWorkoutExportTrigger(deps)` once at app
 * startup. Returns an unsubscribe function for cleanup / testing.
 */
import type { EventBus } from "../event-bus/event-bus";
import type { WorkoutEventMap } from "../event-bus/workout-event-bus";
import type { IntegrationPolicyDeps } from "../integration-policy/integration-policy-deps";
import { resolveExportPolicies } from "../integration-policy/resolve-export-policies.use-case";
import type {
  RecordExportDeps,
  RecordExportInput,
} from "./record-export.use-case";
import { recordExport } from "./record-export.use-case";

export type TriggerDeps = IntegrationPolicyDeps &
  RecordExportDeps & {
    bus: EventBus<WorkoutEventMap>;
    postFn: (
      bridgeId: string,
      payload: Record<string, unknown>
    ) => Promise<{ externalId: string }>;
  };

export const registerSaveWorkoutExportTrigger = (
  deps: TriggerDeps
): (() => void) => {
  const { bus, policyRepo, ledgerRepo, postFn } = deps;

  const handler: WorkoutEventMap["entitySaved"] extends infer P
    ? (payload: P) => void
    : never = async ({ kaiordRecordId, profileId, dataType, payload }) => {
    const policies = await resolveExportPolicies(
      { policyRepo },
      { profileId, dataType }
    );
    const eligible = policies.filter((p) => p.enabled && p.mode === "auto");
    for (const policy of eligible) {
      const input: RecordExportInput = {
        kaiordRecordId,
        dataType,
        destinationBridgeId: policy.bridgeId,
        payload,
        postFn: (p) => postFn(policy.bridgeId, p),
      };
      await recordExport({ ledgerRepo }, input).catch(() => undefined);
    }
  };

  bus.on("entitySaved", handler);
  return () => bus.off("entitySaved", handler);
};
