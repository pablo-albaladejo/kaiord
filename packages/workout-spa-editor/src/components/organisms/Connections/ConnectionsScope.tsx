import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { useConnectionsValue } from "./use-connections-value";

type Props = {
  /** The active athlete's name; absent while the profile row loads. */
  athleteName: string | undefined;
  sources: readonly ConnectionSource[];
};

/* Whose these are and where they live. The `connections` table is per athlete
   but device-local — left out of the sync snapshot — so a source connected on
   the laptop does not exist on the phone, and nothing else on the page says
   so. */
export function ConnectionsScope({ athleteName, sources }: Props) {
  const t = useTranslate("connections");
  const count = useConnectionsValue(sources);

  return (
    <div className="space-y-1" data-testid="connections-scope">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink-strong">
          {athleteName === undefined
            ? t("scope.titleNoName")
            : t("scope.title", { name: athleteName })}
        </p>
        {count !== undefined && (
          <span
            className="text-[12.5px] text-ink-muted"
            data-testid="connections-count"
          >
            {count}
          </span>
        )}
      </div>
      <p className="text-[12.5px] text-ink-muted">{t("scope.hint")}</p>
    </div>
  );
}
