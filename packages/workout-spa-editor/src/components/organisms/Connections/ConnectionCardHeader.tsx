import type { ReactNode } from "react";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { detailKeyFor } from "./connection-card-copy";
import { ConnectionMark } from "./ConnectionMark";
import { ConnectionStatusLine } from "./ConnectionStatusLine";

type Props = { source: ConnectionSource; action?: ReactNode };

export function ConnectionCardHeader({ source, action }: Props) {
  const t = useTranslate("connections");
  const detailKey = detailKeyFor(source);

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
      </div>
      {action}
    </div>
  );
}
