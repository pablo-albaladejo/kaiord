/**
 * /health/labs — DoD-1 manual lab-report entry plus the F3 read surface
 * (latest-per-parameter list, past-report review, delete). Gates on an active
 * profile (a `LabReport` requires `profileId`) before rendering.
 */
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { HealthPageHeader } from "../HealthPageHeader";
import { LabEntryForm } from "./LabEntryForm";
import { LabHistorySection } from "./LabHistorySection";

export default function LabEntryPage() {
  const active = useActiveProfileLive();
  const loading = active === undefined;
  const profileId = active?.id ?? null;

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
          <LabEntryForm />
          <LabHistorySection profileId={profileId} />
        </>
      )}
    </section>
  );
}
