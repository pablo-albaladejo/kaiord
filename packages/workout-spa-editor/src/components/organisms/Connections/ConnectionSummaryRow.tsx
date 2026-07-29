import type { ConnectionSummary } from "../../../application/connections/connection-summary";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { summaryTiles } from "./connection-summary-tiles";
import { ConnectionSummaryTile } from "./ConnectionSummaryTile";

/**
 * `null` means the connection store has not completed a pass yet, which is a
 * different thing from "nothing is connected" and is rendered as such.
 */
type Props = { summary: ConnectionSummary | null };

export function ConnectionSummaryRow({ summary }: Props) {
  const tiles = summaryTiles(summary, {
    t: useTranslate("connections"),
    tCommon: useTranslate("common"),
    locale: useActiveLocale(),
  });

  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="connections-summary"
      data-pending={summary === null}
    >
      {tiles.map((tile) => (
        <ConnectionSummaryTile
          key={tile.id}
          testId={`connections-summary-${tile.id}`}
          label={tile.label}
          value={tile.value}
          note={tile.note}
          tone={tile.tone}
        />
      ))}
    </div>
  );
}
