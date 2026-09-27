import type { ReactNode } from "react";

import { PersistenceProvider } from "../../packages/workout-spa-editor/src/contexts/persistence-context";
import { StatusHeader } from "../../packages/workout-spa-editor/src/components/molecules/StatusHeader/StatusHeader";
import { createInMemoryPersistence } from "../../packages/workout-spa-editor/src/test-utils/in-memory-persistence";

// StatusHeader takes no props: the nav entries, account avatar and
// source-health pill all come from live hooks. It does need one seam, though —
// `useBridgeConnections` calls `usePersistence()` unconditionally, and without
// a provider the card throws rather than rendering empty. The global chain
// deliberately omits persistence (the real port opens Dexie and blanks every
// card), so an in-memory one is supplied here; nothing is seeded, so this shows
// the honest state: no active profile, every source healthy, no pill —
// "silence when all is well" applies to the header too.
//
// The four stories differ only by which route is active. The route has to be
// set through the bundle's own `DesignSystemProviders`: importing wouter here
// would bring a second copy of it, which StatusHeader never reads, and all four
// cards would show the same tab. It is read off the global rather than imported
// for the same reason — an import would compile a second copy into this file.

type Providers = (props: { path: string; children: ReactNode }) => ReactNode;
const Providers: Providers = (props) => {
  const { DesignSystemProviders } = (window as any).KaiordDesignSystem;
  return <DesignSystemProviders {...props} />;
};

const persistence = createInMemoryPersistence();

const onRoute = (path: string) => () => (
  <Providers path={path}>
    <PersistenceProvider persistence={persistence}>
      <StatusHeader />
    </PersistenceProvider>
  </Providers>
);

export const DailyActive = onRoute("/daily");
export const CalendarActive = onRoute("/calendar");
export const LibraryActive = onRoute("/library");
export const TrendsActive = onRoute("/health");
