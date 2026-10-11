import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { BAR_STYLE, FAB_NOTCH_WIDTH } from "./bottom-nav-styles";
import { BOTTOM_NAV_TABS, isTabActive } from "./bottom-nav-tabs";
import { BottomNavFab } from "./BottomNavFab";
import { BottomNavTab } from "./BottomNavTab";

const CREATE_WORKOUT_PATH = "/workout/new";
// The FAB's notch sits between Library (index 2) and Nutrition (index 3).
// With five tabs that slot is off the bar's center, so the FAB is seated in
// the notch itself; centered on the bar it covered the Library tab (F-44).
const NOTCH_INDEX = 3;

/**
 * Floating glass bottom navigation with five tabs and a raised center FAB.
 * Self-contained: derives the active tab and navigates via wouter.
 * Hidden on desktop (`md:hidden`); the desktop header chrome is unchanged.
 */
export function BottomNav() {
  const [location, navigate] = useLocation();
  const t = useTranslate("common");
  return (
    <nav
      aria-label={t("a11y.primary")}
      data-testid="bottom-nav"
      style={BAR_STYLE}
      className="fixed inset-x-(--bottom-nav-gap) z-30 mx-auto flex max-w-md items-stretch rounded-[24px] border border-edge md:hidden"
    >
      {BOTTOM_NAV_TABS.map((tab, index) => (
        <span key={tab.path} className="contents">
          {index === NOTCH_INDEX && (
            <span
              data-testid="bottom-nav-notch"
              className="relative shrink-0"
              style={{ width: FAB_NOTCH_WIDTH }}
            >
              <BottomNavFab onActivate={() => navigate(CREATE_WORKOUT_PATH)} />
            </span>
          )}
          <BottomNavTab
            tab={tab}
            active={isTabActive(tab.path, location)}
            onActivate={navigate}
          />
        </span>
      ))}
    </nav>
  );
}
