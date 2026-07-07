/**
 * /health/labs — DoD-1 manual lab-report entry plus the F3 read surface
 * (latest-per-parameter list, past-report review, delete) and the F5
 * multi-chart dashboard, switched via a minimal in-page tab bar. Gates on
 * an active profile (a `LabReport` requires `profileId`) before rendering.
 */
import { useState } from "react";

import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { HealthPageHeader } from "../HealthPageHeader";
import { LabDashboardSection } from "./dashboard/LabDashboardSection";
import { LabEntryForm } from "./LabEntryForm";
import { LabHistorySection } from "./LabHistorySection";

type LabTab = "entry" | "dashboard";

const TABS: { id: LabTab; label: string }[] = [
  { id: "entry", label: "Entry & history" },
  { id: "dashboard", label: "Dashboard" },
];

export default function LabEntryPage() {
  const active = useActiveProfileLive();
  const loading = active === undefined;
  const profileId = active?.id ?? null;
  const [tab, setTab] = useState<LabTab>("entry");

  return (
    <section data-testid="health-labs">
      <HealthPageHeader title="Lab analytics" subtitle="Add a new lab report" />
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {!loading && !profileId && (
        <p className="text-sm text-gray-600">
          Create an athlete profile first to log lab analytics.
        </p>
      )}
      {!loading && profileId && (
        <>
          <div
            role="tablist"
            className="mb-4 flex gap-2 border-b border-gray-200 dark:border-slate-800"
          >
            {TABS.map(({ id, label }) => (
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
                {label}
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
