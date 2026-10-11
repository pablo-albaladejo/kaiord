/**
 * Where `local/no-jsx-literal-text` runs, and what it lets through.
 *
 * The scope is the set of SPA directories the journey-audit fixes touched
 * (PR1.5 to PR6), each of which was translated end to end. A directory with
 * a trailing `*.tsx` is checked flat, because its subdirectories belong to
 * other surfaces that are not translated yet; `**` takes the whole subtree.
 * Widen the list as other surfaces are translated, never narrow it.
 */

const SPA = "packages/workout-spa-editor/src";

const FLAT = ["components/pages", "components/pages/health"];

const TREES = [
  "components/molecules/BottomNav",
  "components/molecules/CalendarEmptyStates",
  "components/molecules/ChatFab",
  "components/molecules/DefaultProfileNotice",
  "components/molecules/DurationPicker",
  "components/molecules/GoalSetupDialog",
  "components/molecules/PasteButton",
  "components/molecules/ProfileChoiceBanner",
  "components/molecules/PushButton",
  "components/molecules/RepetitionBlockCard",
  "components/molecules/SaveToLibraryButton",
  "components/molecules/ScheduleDateDialog",
  "components/molecules/SetupChecklist",
  "components/molecules/StepCard",
  "components/molecules/StepNotesEditor",
  "components/molecules/TargetPicker",
  "components/molecules/WellnessEntryDialog",
  "components/molecules/WorkoutCard",
  "components/organisms/ProfileManager",
  "components/organisms/ScratchEditorSurface",
  "components/organisms/SettingsPanel",
  "components/organisms/StepEditor",
  "components/organisms/ZoneEditor",
  "components/organisms/ZoneMap",
  "components/pages/AthletePage",
  "components/pages/CreateWorkout",
  "components/pages/Daily",
  "components/pages/Library",
  "components/pages/Nutrition",
  "components/pages/WorkoutDetail",
  "components/pages/WorkoutSection",
  "components/pages/health/trends",
  "components/templates/MainLayout",
];

export const JSX_LITERAL_FILES = [
  ...FLAT.map((dir) => `${SPA}/${dir}/*.tsx`),
  ...TREES.map((dir) => `${SPA}/${dir}/**/*.tsx`),
];

/**
 * Tests and stories render fixtures, not copy. The advanced duration picker
 * is not mounted by any screen (only its own tests render it), so it is out
 * until a screen uses it.
 */
export const JSX_LITERAL_IGNORES = [
  `${SPA}/**/*.test.tsx`,
  `${SPA}/**/*.stories.tsx`,
  `${SPA}/components/molecules/DurationPicker/AdvancedDurationPicker.tsx`,
  `${SPA}/components/molecules/DurationPicker/advanced/**`,
];

/**
 * Copy that is the same in every language: the product name, an API-key
 * shape, units, the zone prefix ("Z3"), the remove glyph and a time format.
 */
export const JSX_LITERAL_ALLOW = [
  "Kaiord Editor",
  "sk-...",
  "kcal",
  "ms",
  "Z",
  "x",
  "mm:ss",
];
