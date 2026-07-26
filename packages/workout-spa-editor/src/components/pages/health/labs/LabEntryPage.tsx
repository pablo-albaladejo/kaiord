/**
 * /health/labs — DoD-1 manual lab-report entry plus the F3 read surface
 * (latest-per-parameter list, past-report review, delete) and the F5
 * multi-chart dashboard, switched via a minimal in-page tab bar. Gates on
 * an active profile (a `LabReport` requires `profileId`) before rendering.
 */
import { useState } from "react";

import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../../i18n/use-translate";
import { HealthPageHeader } from "../HealthPageHeader";
import { LabDashboardSection } from "./dashboard/LabDashboardSection";
import { LabEntryForm } from "./LabEntryForm";
import { LabHistorySection } from "./LabHistorySection";

type LabTab = "entry" | "dashboard";

const TABS: { id: LabTab; labelKey: string }[] = [
  { id: "entry", labelKey: "entry.tabEntry" },
  { id: "dashboard", labelKey: "entry.tabDashboard" },
];

export default function LabEntryPage() {
  const t = useTranslate("labs-ui");
  const active = useActiveProfileLive();
  const loading = active === undefined;
  const profileId = active?.id ?? null;
  const [tab, setTab] = useState<LabTab>("entry");

  return (
    <section data-testid="health-labs">
      <HealthPageHeader
        title={t("entry.title")}
        subtitle={t("entry.subtitle")}
      />
      {loading && <p className="text-sm text-gray-600">{t("entry.loading")}</p>}
      {!loading && !profileId && (
        <p className="text-sm text-gray-600">{t("entry.noProfile")}</p>
      )}
      {!loading && profileId && (
        <>
          <div
            role="tablist"
            className="mb-4 flex gap-2 border-b border-gray-200 dark:border-slate-800"
          >
            {TABS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                data-testid={`lab-tab-${id}`}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 text-sm font-medium ${
                  tab === id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
          {tab === "entry" && (
            <>
              <LabEntryForm />
              <LabHistorySection profileId={profileId} />
            </>
          )}
          {tab === "dashboard" && <LabDashboardSection profileId={profileId} />}
        </>
      )}
    </section>
  );
}
