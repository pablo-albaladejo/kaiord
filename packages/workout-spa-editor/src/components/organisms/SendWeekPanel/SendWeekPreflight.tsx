import { Link } from "wouter";

import type { BulkPreflightFailure } from "../../../application/garmin-bulk/bulk-preflight";
import { useTranslate } from "../../../i18n/use-translate";
import { GarminConnectionNotice } from "../../molecules/ConnectionNotice/GarminConnectionNotice";

const CONNECTIONS_HREF = "/connections";

const OWN_FAILURES: ReadonlySet<BulkPreflightFailure> = new Set([
  "no-export-route",
  "insecure-context",
  "unsupported-browser",
]);

/** The one pre-flight message; a missing route links to where it is set,
    and a Connection that does not work shows its own notice and fix. */
export function SendWeekPreflight({
  failure,
}: {
  failure: BulkPreflightFailure;
}) {
  const t = useTranslate("calendar");
  if (!OWN_FAILURES.has(failure)) {
    return (
      <GarminConnectionNotice
        connection={
          failure as Exclude<
            BulkPreflightFailure,
            "no-export-route" | "insecure-context" | "unsupported-browser"
          >
        }
        testId="send-week-preflight"
      />
    );
  }
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
