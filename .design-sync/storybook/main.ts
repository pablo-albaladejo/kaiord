import type { StorybookConfig } from "@storybook/react-vite";

import base from "../../packages/workout-spa-editor/.storybook/main";

/**
 * The Storybook the design-system sync reads from.
 *
 * Identical to the app's own config except for which stories it picks up. The
 * converter derives the component set from this build, and there is no config
 * knob that excludes a component — `cfg.overrides.<X>.skip` filters stories
 * *within* a card but still emits the card. So a component that cannot be
 * represented honestly is excluded here, at the only place that decides.
 *
 * Excluded:
 *
 * - `SetupChecklist`. Its facts hook returns `dismissed: true` until
 *   `useLiveQuery` resolves — deliberately, so the checklist cannot flash before
 *   its data arrives — and the sync renders against an unseeded database, which
 *   never leaves that state. Its card would be blank. Seeding is not a local
 *   fix: every card shares one origin, so a seeded profile would silently
 *   change the eight other synced components that read the same Dexie singleton
 *   (GarminPushButton, GoalSetupDialog, Daily, WorkoutDetail, ZoneEditor,
 *   CoachingSidebar, AiWorkoutInput, EditorStateRibbon). The design system shows
 *   an empty account throughout; an absent component is honest, a blank card is
 *   a dead end.
 *
 *   Revisit this if the design system ever adopts a populated account — that is
 *   a shared, explicit fixture for every Dexie-reading card, not a per-preview
 *   seed.
 */
const config: StorybookConfig = {
  ...base,
  // A leading "!" entry is not honoured by Storybook's glob, so the exclusion
  // lives in the filename pattern itself.
  stories: [
    {
      directory: "../../packages/workout-spa-editor/src",
      files: "**/!(SetupChecklist).stories.@(js|jsx|mjs|ts|tsx)",
    },
    {
      directory: "../../packages/workout-spa-editor/src",
      files: "**/*.mdx",
    },
  ],
};

export default config;
