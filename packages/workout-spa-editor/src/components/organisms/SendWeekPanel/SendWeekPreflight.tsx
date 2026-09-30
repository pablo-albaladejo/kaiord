import { Link } from "wouter";

import type { BulkPreflightFailure } from "../../../application/garmin-bulk/bulk-preflight";
import { useTranslate } from "../../../i18n/use-translate";

const CONNECTIONS_HREF = "/settings/connections";

/** The one pre-flight message; a missing route links to where it is set. */
export function SendWeekPreflight({
  failure,
}: {
  failure: BulkPreflightFailure;
}) {
  const t = useTranslate("calendar");
  return (
    <p role="status">
      {t(`sendWeek.preflight.${failure}`)}
      {failure === "no-export-route" && (
        <>
          {" "}
          <Link className="underline" href={CONNECTIONS_HREF}>
            {t("sendWeek.openConnections")}
          </Link>
        </>
      )}
    </p>
  );
}
