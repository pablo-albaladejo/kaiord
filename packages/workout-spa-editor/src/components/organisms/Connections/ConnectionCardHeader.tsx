import { connectionNotCheckedText } from "@kaiord/i18n";
import type { ReactNode } from "react";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { detailKeyFor, notCheckedReasonFor } from "./connection-card-copy";
import { ConnectionCardNotice } from "./ConnectionCardNotice";
import { ConnectionMark } from "./ConnectionMark";
import { ConnectionStatusLine } from "./ConnectionStatusLine";

type Props = { source: ConnectionSource; action?: ReactNode };

export function ConnectionCardHeader({ source, action }: Props) {
  const t = useTranslate("connections");
  const locale = useActiveLocale();
  const detailKey = detailKeyFor(source);
  const notChecked = notCheckedReasonFor(source);
  const detail =
    notChecked !== null
      ? connectionNotCheckedText(notChecked, source.name, locale)
      : detailKey !== null
        ? t(detailKey)
        : null;

  return (
    <div className="flex items-start gap-3">
      <ConnectionMark mark={source.mark} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-[15px] font-semibold text-ink-strong">
          {source.name}
        </div>
        <ConnectionStatusLine source={source} />
        {detail !== null && (
          <p
            className="text-[12.5px] leading-snug text-ink-muted"
            data-testid={`connection-detail-${source.id}`}
          >
            {detail}
          </p>
        )}
        <ConnectionCardNotice source={source} />
      </div>
      {action}
    </div>
  );
}
