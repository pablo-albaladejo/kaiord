/**
 * LabLatestValuesSection — the F3.1 latest-per-parameter list (with flags and
 * sparklines) plus, on selecting a parameter, its evolution chart with the
 * reference band and out-of-range markers (F4 / DoD-2). Owns the parameter
 * selection so the list and the chart stay in sync.
 */
import { useState } from "react";

import { LabParameterChartCard } from "./charts/LabParameterChartCard";
import { LabLatestValuesList } from "./LabLatestValuesList";
import { useLabParameterSummariesLive } from "./use-lab-history";

const LOADING = "Loading…";

export const LabLatestValuesSection = ({
  profileId,
}: {
  profileId: string;
}) => {
  const summaries = useLabParameterSummariesLive(profileId);
  const [selected, setSelected] = useState<string | null>(null);
  const toggle = (key: string) =>
    setSelected((prev) => (prev === key ? null : key));

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">Latest values</h3>
      {summaries === undefined ? (
        <p className="text-sm text-gray-600">{LOADING}</p>
      ) : (
        <LabLatestValuesList
          summaries={summaries}
          onSelect={toggle}
          selectedKey={selected}
        />
      )}
      {selected && (
        <LabParameterChartCard profileId={profileId} parameterKey={selected} />
      )}
    </section>
  );
};
