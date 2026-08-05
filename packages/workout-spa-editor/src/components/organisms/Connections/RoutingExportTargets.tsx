import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { sourceName } from "./routing-copy";

type Props = { dataType: string; sentTo: readonly string[] };

/**
 * Rendered only for the two types the registry gives an export capability.
 * "Nowhere" here means a route the user has not switched on; on the other
 * eleven types it would mean a route that cannot be created, which is why the
 * caller omits this whole block rather than passing an empty list.
 */
export function RoutingExportTargets({ dataType, sentTo }: Props) {
  const t = useTranslate("connections");
  return (
    <div className="flex flex-[1_1_180px] flex-wrap items-center gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
        {t("routing.sentTo")}
      </span>
      {sentTo.length === 0 ? (
        <span
          className="text-[12.5px] text-ink-muted"
          data-testid={`routing-nowhere-${dataType}`}
        >
          {t("routing.nowhere")}
        </span>
      ) : (
        sentTo.map((id) => (
          <Pill key={id} tone="neutral">
            {sourceName(id)}
          </Pill>
        ))
      )}
    </div>
  );
}
