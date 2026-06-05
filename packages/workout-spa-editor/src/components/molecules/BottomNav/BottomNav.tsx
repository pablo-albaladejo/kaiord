import { useLocation } from "wouter";

import { BAR_STYLE, FAB_NOTCH_WIDTH } from "./bottom-nav-styles";
import { BOTTOM_NAV_TABS, isTabActive } from "./bottom-nav-tabs";
import { BottomNavFab } from "./BottomNavFab";
import { BottomNavTab } from "./BottomNavTab";

const CREATE_WORKOUT_PATH = "/workout/new";
// FAB notch sits between Library (index 2) and Athlete (index 3).
const NOTCH_INDEX = 3;

/**
 * Floating glass bottom navigation with 4 tabs and a raised center FAB.
 * Self-contained: derives the active tab and navigates via wouter.
 * Hidden on desktop (`md:hidden`); the desktop header chrome is unchanged.
 */
export function BottomNav() {
  const [location, navigate] = useLocation();
  return (
    <nav
      aria-label="Primary"
      data-testid="bottom-nav"
      style={BAR_STYLE}
      className="fixed inset-x-[14px] bottom-[14px] z-30 mx-auto flex max-w-md items-stretch rounded-[24px] border border-slate-700/60 md:hidden"
    >
      {BOTTOM_NAV_TABS.map((tab, index) => (
        <span key={tab.path} className="contents">
          {index === NOTCH_INDEX && (
            <span aria-hidden="true" style={{ width: FAB_NOTCH_WIDTH }} />
          )}
          <BottomNavTab
            tab={tab}
            active={isTabActive(tab.path, location)}
            onActivate={navigate}
          />
        </span>
      ))}
      <BottomNavFab onActivate={() => navigate(CREATE_WORKOUT_PATH)} />
    </nav>
  );
}
