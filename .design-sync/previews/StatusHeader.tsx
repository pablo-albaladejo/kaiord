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
// The four original stories differ only by which route is active, which comes
// from a `parameters.route` value a global Storybook decorator interprets.
// The card harness runs no decorators, so they would render identically here;
// one is kept.

const persistence = createInMemoryPersistence();

export const Default = () => (
  <PersistenceProvider persistence={persistence}>
    <StatusHeader />
  </PersistenceProvider>
);
