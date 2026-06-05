import { Redirect, useLocation, useParams } from "wouter";

import { useFocusOnSectionChange } from "../../../hooks/use-focus-on-section-change";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { Button } from "../../atoms/Button/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import {
  isSettingsTab,
  SETTINGS_TAB_LABELS,
  SETTINGS_TAB_VIEWS,
} from "./settings-tab-views";
import { SettingsGroupList } from "./SettingsGroupList";

type SettingsPageParams = { tab?: string };

const SETTINGS_ROOT = "/settings" as const;

export default function SettingsPage() {
  const { tab } = useParams<SettingsPageParams>();
  const [, navigate] = useLocation();
  useFocusOnSectionChange();

  if (tab !== undefined && !isSettingsTab(tab))
    return <Redirect to={SETTINGS_ROOT} />;

  const ActiveView = tab === undefined ? null : SETTINGS_TAB_VIEWS[tab];
  const heading =
    tab === undefined ? "Settings" : `Settings · ${SETTINGS_TAB_LABELS[tab]}`;

  return (
    <div className="space-y-6 p-4" data-testid="settings-page">
      {tab !== undefined && (
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => navigate(SETTINGS_ROOT)}
          data-testid="settings-back"
        >
          <Icon icon={ICON_MAP.chevL} size="sm" color="inherit" />
          Settings
        </Button>
      )}
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-xl font-semibold text-gray-900 dark:text-white"
      >
        {heading}
      </h1>
      {ActiveView === null ? (
        <SettingsGroupList onNavigate={(to) => navigate(to)} />
      ) : (
        <div
          id={`settings-panel-${tab}`}
          className="min-w-0"
          data-testid={`settings-panel-${tab}`}
        >
          <ActiveView />
        </div>
      )}
    </div>
  );
}
