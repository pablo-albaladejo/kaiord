import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";

/**
 * Chat page heading. Carries the route-heading attribute so the
 * focus-on-route-change hook lands focus here on navigation (rendered
 * eagerly, like LibraryHeader, so focus survives loading→loaded swaps).
 */
export function ChatHeader() {
  const t = useTranslate("chat");
  return (
    <div className="mb-1">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-ink-strong"
      >
        {t("header.title")}
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        {t("header.subtitle")}
      </p>
    </div>
  );
}
