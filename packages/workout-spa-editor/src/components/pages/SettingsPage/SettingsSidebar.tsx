import { useTranslate } from "../../../i18n/use-translate";
import { SettingsAttention } from "./SettingsAttention";
import { SettingsGroupList } from "./SettingsGroupList";

export type SettingsSidebarProps = {
  /**
   * A section is open, so the list becomes the split's section rail:
   * desktop-only and label-only. Off, it is the standalone index.
   */
  railed: boolean;
  /** Current pathname, used to mark the open section's rows. */
  activePath: string;
  onNavigate: (to: string) => void;
};

/* Deliberately not `sticky`: `MainLayout`'s `<main>` carries `overflow-x-hidden`,
   which computes `overflow-y` to `auto` and makes it a scroll container that
   never scrolls, so `position: sticky` inside it is inert (measured in Chromium:
   the rail tracked the scroll 1:1). The rail persists beside the pane either
   way; pinning it needs `overflow-x: clip` on `<main>`, an app-shell change. */
const RAIL_CLASS = "hidden space-y-4 md:block";

export const SettingsSidebar = ({
  railed,
  activePath,
  onNavigate,
}: SettingsSidebarProps) => {
  const t = useTranslate("settings");

  return (
    <nav
      aria-label={t("sectionsNav")}
      className={railed ? RAIL_CLASS : undefined}
      data-testid="settings-sidebar"
    >
      {railed && <SettingsAttention attention={null} variant="chip" />}
      <SettingsGroupList
        onNavigate={onNavigate}
        variant={railed ? "sidebar" : "index"}
        activePath={activePath}
      />
    </nav>
  );
};
