/**
 * Sessions are structured and ready, and nothing can carry them to the watch.
 *
 * The old copy named the missing component ("No bridge extensions detected")
 * and offered "Learn more". This names what the sessions cannot do and why the
 * bridge exists at all, and keeps the route that needs no extension.
 */

import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { PRIMARY } from "./banner-buttons";
import { ConsequenceBanner } from "./ConsequenceBanner";
import { BRIDGE_DOCS_URL } from "./first-run-steps";

export type NoBridgesStateProps = {
  readyCount: number;
};

export function NoBridgesState({ readyCount }: NoBridgesStateProps) {
  const t = useTranslate("calendar");

  return (
    <ConsequenceBanner
      testId="no-bridges-state"
      headline={t(pluralKey("noBridges.headline", readyCount), {
        count: readyCount,
      })}
      consequence={t("noBridges.consequence")}
      actions={
        <a
          href={BRIDGE_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={PRIMARY}
        >
          {t("noBridges.cta")}
        </a>
      }
    />
  );
}
