import { StatusHeader } from "../../packages/workout-spa-editor/src/components/molecules/StatusHeader/StatusHeader";

// StatusHeader takes no props — the nav entries, account avatar and
// source-health pill all come from live Dexie-backed hooks with no
// injectable context seam (same situation as SetupChecklist). The card
// harness's IndexedDB starts empty and unseeded, exactly like Storybook's
// own environment, where every consumer of `useConnectionAttention` treats
// `null` as healthy and renders nothing for it — "silence when all is well"
// applies to the header too. This preview shows that real, reachable state:
// no active profile, every source healthy. The four original stories differ
// only by which route is "active", which depends on a `parameters.route`
// value a global Storybook decorator interprets — decorator machinery the
// card harness does not run — so they render identically here; only one is
// kept.

export const Default = () => <StatusHeader />;
