import type { CapabilityDecisionRepository } from "../ports/capability-decision-repository";
import type { CapabilityDecision } from "../types/capability-decision";

const keyOf = (d: { profileId: string; capabilityId: string }) =>
  `${d.profileId}\u0000${d.capabilityId}`;

export const createInMemoryCapabilityDecisionRepository =
  (): CapabilityDecisionRepository => {
    const rows = new Map<string, CapabilityDecision>();
    return {
      listByProfile: async (profileId) =>
        [...rows.values()].filter((d) => d.profileId === profileId),
      put: async (decision) => {
        rows.set(keyOf(decision), decision);
      },
      deleteByProfile: async (profileId) => {
        for (const [key, d] of rows)
          if (d.profileId === profileId) rows.delete(key);
      },
    };
  };
