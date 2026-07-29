import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";
import { STATUS_DOT, STATUS_TEXT } from "./connection-card-copy";

type Props = { source: ConnectionSource };

/**
 * Freshness is the last row this source wrote to `coachingSyncState`, which
 * survives a reload. `lastCheckedAt` is deliberately not shown: it says when
 * Kaiord last probed, which is seconds ago after every reload no matter how
 * long the source has actually been quiet.
 */
export function ConnectionStatusLine({ source }: Props) {
  const t = useTranslate("connections");
  // Shown for `attention` too: "no new data since X" is most useful exactly
  // when a source is broken, and it is real state that survives a reload.
  const showSync =
    source.status === "connected" ||
    source.status === "installed" ||
    source.status === "attention";
  const when =
    source.lastSyncAt === undefined
      ? undefined
      : formatRelativeTime(new Date(source.lastSyncAt), new Date());

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${STATUS_TEXT[source.status]}`}
        data-testid={`connection-status-${source.id}`}
      >
        <span
          aria-hidden
          className={`h-[7px] w-[7px] shrink-0 rounded-full ${STATUS_DOT[source.status]}`}
        />
        {t(`status.${source.status}`)}
      </span>
      {showSync && (
        <span className="text-[12.5px] text-ink-muted">
          {when === undefined ? t("neverSynced") : t("lastSync", { when })}
        </span>
      )}
    </div>
  );
}
