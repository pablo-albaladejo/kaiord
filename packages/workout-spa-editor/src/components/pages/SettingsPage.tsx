import { useEffect } from "react";
import { Redirect, useLocation, useParams } from "wouter";

import { useFeatureFlag } from "../../lib/feature-flags";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";

type SettingsPageParams = { tab?: string };

const VALID_TABS = [
  "profile",
  "zones",
  "connections",
  "ai",
  "appearance",
  "privacy",
] as const;
type SettingsTab = (typeof VALID_TABS)[number];

const isValidTab = (tab: string | undefined): tab is SettingsTab =>
  VALID_TABS.includes(tab as SettingsTab);

export default function SettingsPage() {
  const { tab } = useParams<SettingsPageParams>();
  const [, navigate] = useLocation();
  const flagOn = useFeatureFlag("ux2026.unifiedSettings");
  const resolvedTab = isValidTab(tab) ? tab : null;

  useEffect(() => {
    if (flagOn && resolvedTab === null) {
      navigate("/settings/profile", { replace: true });
    }
  }, [flagOn, resolvedTab, navigate]);

  if (!flagOn) return <Redirect to="/calendar" />;
  if (resolvedTab === null) return null;

  return (
    <div className="space-y-6 p-4" data-testid="settings-page">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="text-xl font-semibold text-gray-900 dark:text-white"
      >
        Settings · {resolvedTab}
      </h1>
      <p
        className="text-sm text-gray-600 dark:text-gray-400"
        data-testid="settings-page-stub-note"
      >
        Tab content is migrated in a follow-up PR (E+1). The route, tab routing,
        and mechanical guards (R-StranglerExpiry, R-SettingsSingleEntry) ship in
        this PR so the rest of the roadmap can build against a stable URL
        contract.
      </p>
    </div>
  );
}
