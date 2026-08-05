import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";

const NAMES: ReadonlyMap<string, string> = new Map(
  INTEGRATION_REGISTRY.map((entry) => [entry.id, entry.name])
);

/** Display name for a `LinkedCoachingAccount.source`. The registry is the only
    catalog of integration names; an id it does not know is shown verbatim
    rather than guessed at. */
export const sourceDisplayName = (source: string): string =>
  NAMES.get(source) ?? source;
