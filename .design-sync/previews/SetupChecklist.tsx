import { SetupChecklist } from "../../packages/workout-spa-editor/src/components/molecules/SetupChecklist/SetupChecklist";

// SetupChecklist takes no props — every row comes from `useSetupChecklist`,
// which reads Dexie directly (useLiveQuery against the shared singleton, not
// through a React context this preview could swap for an in-memory fake).
// The card harness's IndexedDB starts empty and unseeded, exactly like
// Storybook's own environment, where this resolves to a genuine, reachable
// state: no active profile, nothing done yet, not dismissed (see
// SetupChecklist.stories.tsx). That "brand-new install" card is what this
// preview shows. The other states this component supports (partial
// progress, and dismissed/complete — both of which return null) need
// persisted fixture data with no injectable seam here, so they are not
// represented rather than faked.

export const Default = () => <SetupChecklist />;
