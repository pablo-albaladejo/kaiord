// Storybook loads `preview` from the same directory as the `main` it was given,
// so this config dir needs its own. Without it the sync's Storybook renders
// every story with no stylesheet and no providers — the compare sheets then show
// an unstyled serif column against a styled preview, and every comparison is
// meaningless.
//
// There is nothing to change here: the sync must see exactly what the app's
// Storybook sees. Only the story set differs, and that is `main.ts`'s job.

export { default } from "../.storybook/preview";
