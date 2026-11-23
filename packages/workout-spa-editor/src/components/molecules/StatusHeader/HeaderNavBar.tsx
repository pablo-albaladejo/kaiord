import { useLocation } from "wouter";

import { ICON_MAP } from "../../atoms/Icon/icon-map";
import { BAR_WRAPPER_CLASS } from "./header-menu-styles";
import { NavMenu } from "./NavMenu";
import { isEntryActive } from "./status-entry-active";
import { EntryButton } from "./status-entry-button";
import { useStatusEntries } from "./use-status-entries";

/**
 * The single primary nav row.
 *
 * An entry with children becomes a dropdown listing itself and them, so
 * Trends and Labs read as parent and child instead of as siblings. Below
 * `lg` the entries that do not fit move into one "More" menu, built from the
 * same registry rows the bar just hid — there is no second list to keep in
 * step, which is how Nutrition once went missing from the desktop header.
 */
export function HeaderNavBar() {
  const [location, navigate] = useLocation();
  const { bar, overflow } = useStatusEntries();
  const overflowActive = overflow.some((entry) =>
    isEntryActive(entry, location)
  );

  return (
    <>
      {bar.map((entry) =>
        entry.children.length > 0 ? (
          <NavMenu
            key={entry.id}
            id={entry.id}
            icon={entry.icon}
            entries={[entry, ...entry.children]}
            wrapperClass={BAR_WRAPPER_CLASS[entry.barVisibility] ?? undefined}
            active={isEntryActive(entry, location)}
          />
        ) : (
          <EntryButton
            key={entry.id}
            entry={entry}
            active={isEntryActive(entry, location)}
            onClick={() => navigate(entry.to)}
          />
        )
      )}
      {/* The overflow trigger is the only reason Trends, Labs and Chat stay
          reachable below `lg`; the bottom nav has no room for them. */}
      <NavMenu
        id="more"
        icon={ICON_MAP.dots}
        entries={overflow}
        wrapperClass="lg:hidden"
        active={overflowActive}
      />
    </>
  );
}
