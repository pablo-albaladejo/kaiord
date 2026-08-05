import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { useFocusOnRouteChange } from "../../../hooks/use-focus-on-route-change";
import { useRouteAnnouncerLabel } from "../../../hooks/use-route-announcer-label";
import { BottomNav } from "../../molecules/BottomNav";
import { ChatFab } from "../../molecules/ChatFab/ChatFab";
import { StorageAvailabilityBanner } from "../../molecules/StorageAvailabilityBanner";
import { LayoutHeader } from "./LayoutHeader";

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  useFocusOnRouteChange();
  const routeLabel = useRouteAnnouncerLabel();
  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <LayoutHeader />
      {/*
        Route announcer.
        - `polite` because navigation announcements should not interrupt
          user-typed input or in-flight feedback (e.g. toast); `assertive`
          is reserved for errors.
        - `aria-atomic="true"` so the announcer label is read as a single
          unit — without it, some assistive technology diffs the old and
          new labels and reads only the changed token, producing partial
          announcements like "Library" instead of "Library page".
        - Portalled to `document.body` so it is a *sibling* of `#root`,
          not a descendant. `aria-hidden`'s `hideOthers` (used by Radix
          modal dialogs) exempts `[aria-live]` nodes and every ancestor
          of them; leaving the announcer inside `#root` therefore forces
          the hide down onto `#root`'s children instead of covering the
          app subtree in one attribute. The node is `sr-only` and
          position-independent, so this is visually inert.
      */}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          data-testid="route-announcer"
        >
          {routeLabel}
        </div>,
        document.body
      )}
      <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <StorageAvailabilityBanner />
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 overflow-x-hidden px-4 py-6 pb-28 sm:px-6 lg:px-8 md:pb-6">
        {children}
      </main>
      <ChatFab />
      <BottomNav />
    </div>
  );
};
