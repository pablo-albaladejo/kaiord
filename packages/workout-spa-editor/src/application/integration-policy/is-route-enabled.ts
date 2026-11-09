import type { IntegrationPolicy } from "../../types/integration-policy";

/** Whether the resolved policies hold an enabled route for `bridgeId`. */
export const isRouteEnabled = (
  policies: ReadonlyArray<Pick<IntegrationPolicy, "bridgeId" | "enabled">>,
  bridgeId: string
): boolean => policies.some((p) => p.enabled && p.bridgeId === bridgeId);
