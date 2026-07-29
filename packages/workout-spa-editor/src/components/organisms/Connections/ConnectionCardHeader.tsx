import type { ReactNode } from "react";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { sourceFixUrl } from "../../../application/connections/source-fix-link";
import { useTranslate } from "../../../i18n/use-translate";
import { ConnectionMark } from "../AthleteConnections/ConnectionMark";
import { detailKeyFor } from "./connection-card-copy";
import { ConnectionStatusLine } from "./ConnectionStatusLine";

type Props = { source: ConnectionSource; action?: ReactNode };

export function ConnectionCardHeader({ source, action }: Props) {
  const t = useTranslate("connections");
  const detailKey = detailKeyFor(source);
  // Sits under the detail line rather than beside the action: it is the
  // answer to the sentence above it, and the action slot is where the card's
  // own controls live — a link out is not one of them.
  const fixUrl = sourceFixUrl(source);

  return (
    <div className="flex items-start gap-3">
      <ConnectionMark mark={source.mark} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-[15px] font-semibold text-ink-strong">
          {source.name}
        </div>
        <ConnectionStatusLine source={source} />
        {detailKey !== null && (
          <p className="text-[12.5px] leading-snug text-ink-muted">
            {t(detailKey)}
          </p>
        )}
        {fixUrl !== null && (
          <a
            href={fixUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid={`connection-fix-${source.id}`}
            className="inline-block text-[12.5px] font-semibold text-accent"
          >
            {t("fixAtSource", { name: source.name })}
          </a>
        )}
      </div>
      {action}
    </div>
  );
}
