import { Redirect, useLocation, useParams } from "wouter";

import { useFocusOnSectionChange } from "../../../hooks/use-focus-on-section-change";
import { useTranslate } from "../../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Button } from "../../atoms/Button/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { isSettingsTab, SETTINGS_TAB_VIEWS } from "./settings-tab-views";
import { SettingsAttention } from "./SettingsAttention";
import { SettingsGroupList } from "./SettingsGroupList";
import { SettingsSectionRail } from "./SettingsSectionRail";
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
  const [, navigate] = useLocation();
  const t = useTranslate("settings");
  useFocusOnSectionChange();
  useSectionScrollReset(section);

  const open = isSettingsTab(section) ? section : undefined;
  if (section !== undefined && open === undefined)
    return <Redirect to={SETTINGS_ROOT} />;

  const ActiveView = open === undefined ? null : SETTINGS_TAB_VIEWS[open];
  const heading =
    open === undefined ? t("title") : `${t("title")} · ${t(`tabs.${open}`)}`;

  return (
    <div className="space-y-6 p-4" data-testid="settings-page">
      {open !== undefined && (
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
      {open === undefined || ActiveView === null ? (
        <SettingsGroupList onNavigate={navigate} />
      ) : (
        <div className={SPLIT_CLASS}>
          <SettingsSectionRail activeSection={open} />
          <div
            id={`settings-panel-${open}`}
            className="min-w-0"
            data-testid={`settings-panel-${open}`}
          >
            <ActiveView />
          </div>
        </div>
      )}
    </div>
  );
}
