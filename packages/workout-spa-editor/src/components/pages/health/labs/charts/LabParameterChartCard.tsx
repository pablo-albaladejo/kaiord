/**
 * LabParameterChartCard — the evolution chart opened from the F3 list (DoD-2).
 * Loads the selected parameter's series live and renders its chart with the
 * reference band and out-of-range markers.
 */
import { useActiveLocale } from "../../../../../i18n/LocaleProvider";
import { useTranslate } from "../../../../../i18n/use-translate";
import { labParameterLabel } from "../lab-parameter-label";
import { LabParameterChart } from "./LabParameterChart";
import { useLabValueSeriesLive } from "./use-lab-value-series";

export const LabParameterChartCard = ({
  profileId,
  parameterKey,
}: {
  profileId: string;
  parameterKey: string;
}) => {
  const values = useLabValueSeriesLive(profileId, parameterKey);
  const locale = useActiveLocale();
  const t = useTranslate("labs-ui");
  return (
    <div data-testid="lab-parameter-chart-card" className="mt-3">
      <h4 className="mb-2 text-sm font-semibold">
        {t("chart.evolutionTitle", {
          label: labParameterLabel(parameterKey, locale),
        })}
      </h4>
      {values === undefined ? (
        <p className="text-sm text-gray-600">{t("chart.loading")}</p>
      ) : (
        <LabParameterChart parameterKey={parameterKey} values={values} />
      )}
    </div>
  );
};
