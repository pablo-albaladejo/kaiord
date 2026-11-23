import { useLocation } from "wouter";

import { useOfferedNavDestinations } from "../../../hooks/use-offered-nav-destinations";
import { useTranslate } from "../../../i18n/use-translate";
import { BAR_STYLE, FAB_NOTCH_WIDTH } from "./bottom-nav-styles";
import { bottomNavTabsOf, isTabActive, notchIndexOf } from "./bottom-nav-tabs";
import { BottomNavFab } from "./BottomNavFab";
import { BottomNavTab } from "./BottomNavTab";

const CREATE_WORKOUT_PATH = "/workout/new";
// The FAB is seated in its notch, not centered on the bar: with five tabs
// the bar's center falls inside a tab, which the FAB then covered (F-44).

/**
 * Floating glass bottom navigation with the offered tabs and a raised FAB.
 * Self-contained: derives the active tab and navigates via wouter.
 * Hidden on desktop (`md:hidden`); the desktop header chrome is unchanged.
 */
export function BottomNav() {
  const [location, navigate] = useLocation();
  const t = useTranslate("common");
  const tabs = bottomNavTabsOf(useOfferedNavDestinations());
  const notchIndex = notchIndexOf(tabs.length);
  return (
    <nav
      aria-label={t("a11y.primary")}
      data-testid="bottom-nav"
      style={BAR_STYLE}
      className="fixed inset-x-(--bottom-nav-gap) z-30 mx-auto flex max-w-md items-stretch rounded-[24px] border border-edge md:hidden"
    >
      {tabs.map((tab, index) => (
        <span key={tab.path} className="contents">
          {index === notchIndex && (
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
