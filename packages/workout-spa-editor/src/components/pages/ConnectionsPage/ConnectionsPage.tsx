import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { ConnectionsTab } from "../../organisms/Connections/ConnectionsTab";

/* The athlete's external accounts: their own page, out of Settings, because
   they belong to the athlete and not to the app (P-07). */
export default function ConnectionsPage() {
  const t = useTranslate("connections");

  return (
    <div className="space-y-6 p-4" data-testid="connections-page">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-xl font-semibold text-ink-strong"
      >
        {t("title")}
      </h1>
      <ConnectionsTab />
    </div>
  );
}
