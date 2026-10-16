import type { Translate } from "../../i18n/use-translate";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";

const NAMES: ReadonlyMap<string, string> = new Map(
  INTEGRATION_REGISTRY.map((entry) => [entry.id, entry.name])
);

/** Display name for a `LinkedCoachingAccount.source`. The registry is the only
    catalog of integration names; an id it does not know is shown verbatim
    rather than guessed at. Brand names stay as they are; manual entry is
    ours, so it is translated with the `connections` translator. */
export const sourceDisplayName = (source: string, t: Translate): string =>
  source === "manual" ? t("sourceName.manual") : (NAMES.get(source) ?? source);
