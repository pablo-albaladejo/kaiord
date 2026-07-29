import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { formatRelativeTime } from "../../../utils/format-relative-time";
import { sourceName } from "./routing-copy";

type Props = { sourceId: string; at: string | undefined };

/**
 * When this row's source last sent Kaiord anything — deliberately phrased with
 * the SOURCE as the subject. `coachingSyncState` is keyed by (source, profile)
 * and carries no data type, so "Sleep arrived 2 minutes ago" is not a sentence
 * the state can support; every row Garmin feeds shows Garmin's one timestamp.
 *
 * Nothing renders without a stored timestamp: manual entry writes no sync row
 * at all, and a bridge that has never delivered already says so on its card.
 */
export function RoutingFreshness({ sourceId, at }: Props) {
  const t = useTranslate("connections");
  const tCommon = useTranslate("common");
  const locale = useActiveLocale();
  if (at === undefined) return null;

  const relative = formatRelativeTime(new Date(at), new Date(), locale);
  return (
    <span
      className="text-[12px] text-ink-muted"
      data-testid={`routing-synced-${sourceId}`}
    >
      {t("routing.sourceLastSent", {
        name: sourceName(sourceId),
        when: tCommon(relative.key, relative.params),
      })}
    </span>
  );
}
