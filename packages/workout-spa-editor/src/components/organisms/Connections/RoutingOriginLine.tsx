import type { ManagedDataType } from "@kaiord/core";

import type { RoutingOrigin } from "../../../application/connections/data-type-routing";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { originLabel, originNote, originSourceId } from "./routing-copy";
import { RoutingFreshness } from "./RoutingFreshness";

type Props = {
  dataType: ManagedDataType;
  origin: RoutingOrigin;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
};

const CAPTION =
  "text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted";

/** What the row is read from today: the source, when one is real, its freshness
    and the note the two ambiguous origins need. */
export function RoutingOriginLine({ dataType, origin, lastSyncedAt }: Props) {
  const t = useTranslate("connections");
  const sourceId = originSourceId(origin);
  const note = originNote(origin, t);

  return (
    <div className="flex flex-[1_1_220px] flex-wrap items-center gap-2">
      <span className={CAPTION}>{t("routing.from")}</span>
      <Pill
        tone={sourceId === undefined ? "neutral" : "accent"}
        data-testid={`routing-from-${dataType}`}
      >
        {originLabel(origin, t)}
      </Pill>
      {sourceId !== undefined && (
        <RoutingFreshness sourceId={sourceId} at={lastSyncedAt.get(sourceId)} />
      )}
      {note !== undefined && (
        <span
          className="text-[12px] text-ink-muted"
          data-testid={`routing-note-${dataType}`}
        >
          {note}
        </span>
      )}
    </div>
  );
}
