import type { CapabilityId } from "../../lib/capabilities/capability-catalogue";
import type { CapabilityDecisionRepository } from "../../ports/capability-decision-repository";
import type { ProfileRepository } from "../../ports/persistence-port";
import { ProfileNotFoundError } from "../../types/session-match-errors";

export type SetCapabilityInput = {
  profileId: string;
  id: CapabilityId;
  on: boolean;
};

export type SetCapabilityDeps = {
  clock: () => string;
  capabilityDecisions: Pick<CapabilityDecisionRepository, "put">;
  profiles: Pick<ProfileRepository, "getById">;
};

/**
 * Records the athlete's decision for one Capability and touches nothing
 * else: deactivating hides a Capability's surfaces, never its data. The
 * decision is a row of its own, so no write of the preferences row (by this
 * build or an older one) can erase it.
 */
export async function setCapability(
  input: SetCapabilityInput,
  deps: SetCapabilityDeps
): Promise<void> {
  if (!(await deps.profiles.getById(input.profileId))) {
    throw new ProfileNotFoundError(input.profileId);
  }
  await deps.capabilityDecisions.put({
    profileId: input.profileId,
    capabilityId: input.id,
    on: input.on,
    updatedAt: deps.clock(),
  });
}
