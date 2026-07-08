/**
 * LabParameterChartCard — the evolution chart opened from the F3 list (DoD-2).
 * Loads the selected parameter's series live and renders its chart with the
 * reference band and out-of-range markers.
 */
import { useActiveLocale } from "../../../../../i18n/LocaleProvider";
import { labParameterLabel } from "../lab-parameter-label";
import { LabParameterChart } from "./LabParameterChart";
import { useLabValueSeriesLive } from "./use-lab-value-series";

const LOADING = "Loading…";

export const LabParameterChartCard = ({
  profileId,
  parameterKey,
}: {
  profileId: string;
  parameterKey: string;
}) => {
  const values = useLabValueSeriesLive(profileId, parameterKey);
  const locale = useActiveLocale();
  return (
    <div data-testid="lab-parameter-chart-card" className="mt-3">
      <h4 className="mb-2 text-sm font-semibold">
        {labParameterLabel(parameterKey, locale)} evolution
      </h4>
      {values === undefined ? (
        <p className="text-sm text-gray-600">{LOADING}</p>
      ) : (
        <LabParameterChart parameterKey={parameterKey} values={values} />
      )}
    </div>
  );
};
