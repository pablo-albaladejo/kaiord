/**
 * Drive fetch with the bearer token, refreshed when it expired or Drive
 * answers 401. Google's token popup only opens from a user gesture, so
 * outside one a missing token becomes `CloudAuthRequiredError` instead of a
 * blocked popup: the sync waits for the next click rather than failing.
 */

import { CloudAuthRequiredError } from "../../types/cloud-auth-required-error";
import type { GisAuth } from "./gis-token-client";

export type DriveFetch = (url: string, init?: RequestInit) => Promise<Response>;

type UserActivationNavigator = { userActivation?: { isActive: boolean } };

/** Without the API (older Safari) assume a gesture and let GIS decide. */
const hasUserGesture = (): boolean =>
  (navigator as UserActivationNavigator).userActivation?.isActive ?? true;

export function createDriveAuthedFetch(
  auth: GisAuth,
  canPrompt: () => boolean = hasUserGesture
): DriveFetch {
  const ensureToken = async () => {
    if (auth.isAuthenticated()) return;
    if (!canPrompt()) throw new CloudAuthRequiredError();
    try {
      await auth.authenticate();
    } catch {
      throw new CloudAuthRequiredError();
    }
  };

  const send = (url: string, init: RequestInit) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${auth.getAccessToken()}`,
      },
    });

  return async (url, init = {}) => {
    await ensureToken();
    const res = await send(url, init);
    if (res.status !== 401) return res;
    auth.invalidate();
    await ensureToken();
    return send(url, init);
  };
}
