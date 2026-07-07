/**
 * LabDashboardSection — F5 multi-chart dashboard. Reuses the F3
 * latest-values list as the "vista de conjunto" parameter picker (clicking
 * a row pins/unpins it, highlighted via `selectedKeys`) and renders one F4
 * `LabParameterChartCard` per pinned parameter in a grid. The selection is
 * persisted in `userPreferences.labDashboardParams` and survives reload.
 */
import { LabParameterChartCard } from "../charts/LabParameterChartCard";
import { LabLatestValuesList } from "../LabLatestValuesList";
import { useLabParameterSummariesLive } from "../use-lab-history";
import { useLabDashboardParams } from "./use-lab-dashboard-params";

const LOADING = "Loading…";
const EMPTY_GRID_MSG = "Pin a parameter above to see its evolution chart.";

export const LabDashboardSection = ({ profileId }: { profileId: string }) => {
  const summaries = useLabParameterSummariesLive(profileId);
  const { pinned, toggle } = useLabDashboardParams(profileId);
  const pinnedKeys = new Set(pinned);

  return (
    <section data-testid="lab-dashboard">
      <h3 className="mb-2 text-sm font-semibold">Pin parameters</h3>
      {summaries === undefined ? (
        <p className="text-sm text-gray-600">{LOADING}</p>
      ) : (
        <LabLatestValuesList
          summaries={summaries}
          onSelect={toggle}
          selectedKeys={pinnedKeys}
        />
      )}
      <h3 className="mt-6 mb-2 text-sm font-semibold">Evolution charts</h3>
      {pinned.length === 0 ? (
        <p className="text-sm text-gray-600">{EMPTY_GRID_MSG}</p>
      ) : (
        <div
          data-testid="lab-dashboard-grid"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {pinned.map((parameterKey) => (
            <LabParameterChartCard
              key={parameterKey}
              profileId={profileId}
              parameterKey={parameterKey}
            />
          ))}
        </div>
      )}
    </section>
  );
};
