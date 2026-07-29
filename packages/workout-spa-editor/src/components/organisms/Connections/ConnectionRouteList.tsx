import type { ManagedDataType } from "@kaiord/core";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { type Translate, useTranslate } from "../../../i18n/use-translate";

type RowProps = {
  labelKey: string;
  types: readonly ManagedDataType[];
  detected: boolean;
  t: Translate;
};

const emptyKey = (detected: boolean): string =>
  detected ? "manage.nothing" : "manage.unknown";

function RouteRow({ labelKey, types, detected, t }: RowProps) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
        {t(labelKey)}
      </div>
      <div className="text-[13px] leading-relaxed text-ink-body">
        {types.length === 0
          ? t(emptyKey(detected))
          : types.map((type) => t(`dataTypes.${type}`)).join(" · ")}
      </div>
    </div>
  );
}

type Props = { source: ConnectionSource };

/**
 * What this source moves, named rather than counted. Both lists come from the
 * announced-and-cabled intersection, so "Nothing" here is a fact about the
 * SPA's wiring — `trainingpeaks-bridge` announces `write:body` and Kaiord
 * cables no export for it, and the honest answer is that nothing goes back.
 */
export function ConnectionRouteList({ source }: Props) {
  const t = useTranslate("connections");
  return (
    <div className="space-y-3">
      <RouteRow
        labelKey="manage.sends"
        types={source.importTypes}
        detected={source.bridgeDetected}
        t={t}
      />
      <RouteRow
        labelKey="manage.receives"
        types={source.exportTypes}
        detected={source.bridgeDetected}
        t={t}
      />
    </div>
  );
}
