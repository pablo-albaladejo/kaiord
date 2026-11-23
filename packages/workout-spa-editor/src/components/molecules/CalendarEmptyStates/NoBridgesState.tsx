/**
 * Sessions are structured and ready, and nothing can carry them to the watch.
 *
 * The headline names what the sessions cannot do; the rest is the Garmin
 * Connection's Install notice and its one fix, the words every other surface
 * shows for a missing extension.
 */

import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { useConnectionNotice } from "../ConnectionNotice/use-connection-notice";
import { PRIMARY } from "./banner-buttons";
import { ConsequenceBanner } from "./ConsequenceBanner";
import { BRIDGE_DOCS_URL } from "./first-run-steps";

export type NoBridgesStateProps = {
  readyCount: number;
};

export function NoBridgesState({ readyCount }: NoBridgesStateProps) {
  const t = useTranslate("calendar");
  const install = useConnectionNotice("not-installed", "Garmin");

  return (
    <ConsequenceBanner
      testId="no-bridges-state"
      headline={t(pluralKey("noBridges.headline", readyCount), {
        count: readyCount,
      })}
      consequence={install?.message ?? ""}
      actions={
        <a
          href={BRIDGE_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={PRIMARY}
        >
          {install?.action}
        </a>
      }
    />
  );
}
