import { useEffect } from "react";
import { Redirect, useLocation, useParams } from "wouter";

import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import {
  DEFAULT_SETTINGS_TAB,
  isSettingsTab,
  SETTINGS_TAB_LABELS,
  SETTINGS_TAB_VIEWS,
} from "./settings-tab-views";
import { SettingsPageTabs } from "./SettingsPageTabs";

type SettingsPageParams = { tab?: string };

const DEFAULT_REDIRECT = `/settings/${DEFAULT_SETTINGS_TAB}` as const;

export default function SettingsPage() {
  const { tab } = useParams<SettingsPageParams>();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (tab === undefined) navigate(DEFAULT_REDIRECT, { replace: true });
  }, [tab, navigate]);

  if (tab === undefined) return null;
  if (!isSettingsTab(tab)) return <Redirect to={DEFAULT_REDIRECT} />;

  const ActiveView = SETTINGS_TAB_VIEWS[tab];
  const handleSelect = (next: SettingsTab) => navigate(`/settings/${next}`);

  return (
    <div className="space-y-6 p-4" data-testid="settings-page">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-xl font-semibold text-gray-900 dark:text-white"
      >
        Settings · {SETTINGS_TAB_LABELS[tab]}
      </h1>
      <div className="flex flex-col gap-6 sm:flex-row">
        <SettingsPageTabs activeTab={tab} onSelect={handleSelect} />
        <div
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
          className="min-w-0 flex-1"
          data-testid={`settings-panel-${tab}`}
        >
          <ActiveView />
        </div>
      </div>
    </div>
  );
}
