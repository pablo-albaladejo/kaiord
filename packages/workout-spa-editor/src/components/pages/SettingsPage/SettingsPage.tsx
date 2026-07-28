import { Redirect, useLocation, useParams } from "wouter";

import { useFocusOnSectionChange } from "../../../hooks/use-focus-on-section-change";
import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Button } from "../../atoms/Button/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { isSettingsTab, SETTINGS_TAB_VIEWS } from "./settings-tab-views";
import { SettingsAttention } from "./SettingsAttention";
import { SettingsSidebar } from "./SettingsSidebar";
import { useSectionScrollReset } from "./use-section-scroll-reset";

/**
 * `section` is the path segment naming the open panel (`/settings/ai`). It is
 * distinct from the `?section=` query, which anchors a sub-section *inside* a
 * panel and is handled by `useFocusOnSectionChange`.
 */
type SettingsPageParams = { section?: string };

const SETTINGS_ROOT = "/settings" as const;

/* Responsive is CSS-only — no viewport is measured in JS, so the index is
   what renders wherever the `md` breakpoint does not apply. */
const SPLIT_CLASS =
  "md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start md:gap-6";

export default function SettingsPage() {
  const { section } = useParams<SettingsPageParams>();
  const [location, navigate] = useLocation();
  const t = useTranslate("settings");
  useFocusOnSectionChange();
  useSectionScrollReset(section);

  if (section !== undefined && !isSettingsTab(section))
    return <Redirect to={SETTINGS_ROOT} />;

  const ActiveView = section === undefined ? null : SETTINGS_TAB_VIEWS[section];
  const heading =
    section === undefined
      ? t("title")
      : `${t("title")} · ${t(`tabs.${section}`)}`;

  return (
    <div className="space-y-6 p-4" data-testid="settings-page">
      {section !== undefined && (
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => navigate(SETTINGS_ROOT)}
          className="md:hidden"
          data-testid="settings-back"
        >
          <Icon icon={ICON_MAP.chevL} size="sm" color="inherit" />
          {t("back")}
        </Button>
      )}
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-xl font-semibold text-gray-900 dark:text-white"
      >
        {heading}
      </h1>
      <SettingsAttention attention={null} variant="banner" />
      <div className={section === undefined ? undefined : SPLIT_CLASS}>
        <SettingsSidebar
          railed={section !== undefined}
          activePath={location}
          onNavigate={navigate}
        />
        {ActiveView !== null && (
          <div
            id={`settings-panel-${section}`}
            className="min-w-0"
            data-testid={`settings-panel-${section}`}
          >
            <ActiveView />
          </div>
        )}
      </div>
    </div>
  );
}
