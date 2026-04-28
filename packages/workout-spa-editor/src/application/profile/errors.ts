/**
 * Profile-layer error types.
 *
 * `ProfileNotFoundError` is thrown by use cases that take a `profileId`
 * argument when the target profile no longer exists (deleted between user
 * action and use-case execution). Catchers surface a "Profile no longer
 * exists" toast and abort the operation cleanly — no partial state.
 */

export class ProfileNotFoundError extends Error {
  override readonly name = "ProfileNotFoundError";
  readonly profileId: string;
  constructor(profileId: string) {
    super(`Profile not found: ${profileId}`);
    this.profileId = profileId;
  }
}
