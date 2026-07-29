import { useTranslate } from "../../../i18n/use-translate";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { SETTINGS_TAB_ORDER } from "./settings-tab-views";
import {
  SettingsAttention,
  type SettingsAttentionModel,
} from "./SettingsAttention";

export type SettingsSectionRailProps = {
  activeSection: SettingsTab;
  onNavigate: (to: string) => void;
  /** `null` renders no chip; the rail is the desktop attention surface. */
  attention: SettingsAttentionModel | null;
};

/* Desktop-only: below `md` the open section takes the whole surface and the
   back control returns to the index. Not sticky — `MainLayout`'s `<main>` is a
   scroll container that never scrolls, so `position: sticky` inside it is
   inert (measured; see the change's design.md D9). */
const RAIL_CLASS = "hidden space-y-4 md:block";

const ENTRY_CLASS =
  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800";

const ACTIVE_ENTRY_CLASS = `${ENTRY_CLASS} bg-primary-50 text-gray-900 dark:bg-primary-900/20 dark:text-white`;

/**
 * The split's section rail. Entries are the sections themselves, not the
 * index's rows: three index rows lead to `preferences` and two to `ai`, so a
 * row-shaped rail would mark several rows current for one open section and
 * would repeat the panel's own headings word for word.
 */
export const SettingsSectionRail = ({
  activeSection,
  onNavigate,
  attention,
}: SettingsSectionRailProps) => {
  const t = useTranslate("settings");

  return (
    <nav
      aria-label={t("sectionsNav")}
      className={RAIL_CLASS}
      data-testid="settings-section-rail"
    >
      <SettingsAttention attention={attention} variant="chip" />
      <div className="space-y-1">
        {SETTINGS_TAB_ORDER.map((section) => {
          const active = section === activeSection;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(`/settings/${section}`)}
              aria-current={active ? "page" : undefined}
              className={active ? ACTIVE_ENTRY_CLASS : ENTRY_CLASS}
              data-testid={`settings-section-${section}`}
            >
              {t(`tabs.${section}`)}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
