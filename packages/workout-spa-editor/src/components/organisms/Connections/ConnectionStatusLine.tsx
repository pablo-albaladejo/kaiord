import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";
import { AttentionMark } from "../../atoms/AttentionMark";
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
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();
  // Shown for `attention` too: "no new data since X" is most useful exactly
  // when a source is broken, and it is real state that survives a reload.
  const showSync =
    source.status === "connected" ||
    source.status === "installed" ||
    source.status === "attention";
  // `formatRelativeTime` returns a translation key plus its params rather than
  // a formatted string, so the wording follows the active locale instead of
  // leaking English into a Spanish surface.
  const relative =
    source.lastSyncAt === undefined
      ? undefined
      : formatRelativeTime(new Date(source.lastSyncAt), new Date(), locale);
  const when =
    relative === undefined ? undefined : tCommon(relative.key, relative.params);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={`flex items-center gap-1.5 text-[12.5px] font-medium ${STATUS_TEXT[source.status]}`}
        data-testid={`connection-status-${source.id}`}
      >
        {source.status === "attention" ? (
          <AttentionMark size="xs" />
        ) : (
          <span
            aria-hidden
            className={`h-[7px] w-[7px] shrink-0 rounded-full ${STATUS_DOT[source.status]}`}
          />
        )}
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
