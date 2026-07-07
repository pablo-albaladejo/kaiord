/**
 * /health/labs — DoD-1 manual lab-report entry. Gates on an active profile
 * (a `LabReport` requires `profileId`) before rendering the form.
 */
import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { HealthPageHeader } from "../HealthPageHeader";
import { LabEntryForm } from "./LabEntryForm";

export default function LabEntryPage() {
  const active = useActiveProfileLive();
  const loading = active === undefined;
  const hasProfile = Boolean(active?.id);

  return (
    <section data-testid="health-labs">
      <HealthPageHeader title="Lab analytics" subtitle="Add a new lab report" />
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {!loading && !hasProfile && (
        <p className="text-sm text-gray-600">
          Create an athlete profile first to log lab analytics.
        </p>
      )}
      {!loading && hasProfile && <LabEntryForm />}
    </section>
  );
}
