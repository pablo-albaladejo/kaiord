/**
 * Raw sessions arrived and there is no key to turn them into steps.
 *
 * This is the week's one action when no provider is configured — the batch
 * banner does not also render, because both are statements about the same raw
 * count and only one of them can be acted on.
 */
import { useLocation } from "wouter";

import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";
import { BannerButton } from "./banner-buttons";
import { ConsequenceBanner } from "./ConsequenceBanner";

export type NoAiProviderStateProps = {
  rawCount: number;
};

export function NoAiProviderState({ rawCount }: NoAiProviderStateProps) {
  const t = useTranslate("calendar");
  const [, navigate] = useLocation();

  return (
    <ConsequenceBanner
      testId="no-ai-provider-state"
      headline={t(pluralKey("noAiProvider.headline", rawCount), {
        count: rawCount,
      })}
      consequence={t("noAiProvider.consequence")}
      actions={
        <BannerButton primary onClick={() => navigate("/settings/ai")}>
          {t("noAiProvider.cta")}
        </BannerButton>
      }
    />
  );
}
