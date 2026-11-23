import { useDestinationStatus } from "../../../hooks/use-destination-status";
import { useTranslate } from "../../../i18n/use-translate";
import { DataFlowInventory } from "./DataFlowInventory";
import { PrivacyInformationSection } from "./PrivacyInformationSection";
import { TracesSection } from "./traces/TracesSection";

/** What leaves this browser, where it goes, and what is measured. */
export const PrivacyTab: React.FC = () => {
  const t = useTranslate("settings");
  const active = useDestinationStatus();

  return (
    <div className="space-y-6">
      <DataFlowInventory active={active} />
      <TracesSection />
      <PrivacyInformationSection />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-body">
          {t("privacy.analytics")}
        </h3>
        <p className="text-sm text-ink-body">
          {t("privacy.analyticsIntro")}{" "}
          <a
            href="https://umami.is/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink-body"
          >
            {t("privacy.analyticsLink")}
          </a>{" "}
          {t("privacy.analyticsOutro")}
        </p>
      </section>
    </div>
  );
};
