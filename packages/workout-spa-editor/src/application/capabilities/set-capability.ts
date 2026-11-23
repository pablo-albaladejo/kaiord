import {
  setUserPreferenceFields,
  type SetUserPreferenceFieldsDeps,
} from "../set-user-preference-fields";

export type SetCapabilityInput = {
  profileId: string;
  id: string;
  on: boolean;
};

/**
 * Records the athlete's decision for one Capability and touches nothing
 * else: deactivating hides a Capability's surfaces, never its data.
 */
export async function setCapability(
  input: SetCapabilityInput,
  deps: SetUserPreferenceFieldsDeps
): Promise<void> {
  const existing = await deps.repository.get(input.profileId);
  await setUserPreferenceFields(
    {
      profileId: input.profileId,
      patch: {
        capabilities: { ...existing?.capabilities, [input.id]: input.on },
      },
    },
    deps
  );
}
