import { PreferencesTab } from "./PreferencesTab";
import { ThemeRow } from "./ThemeRow";

/** What this device shows: language, units, notifications and theme. */
export const GeneralTab: React.FC = () => (
  <div className="space-y-6" data-testid="settings-general">
    <PreferencesTab />
    <ThemeRow />
  </div>
);
