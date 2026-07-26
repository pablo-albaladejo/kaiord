/**
 * Tap-to-fill prompt suggestions shown on the Create input phase. `key` is the
 * stable React key and the i18n key selector; `label` is the dotted
 * `create-workout` translation key resolved at render. The visible (translated)
 * label becomes the prompt payload when a chip is tapped.
 */
export type ExamplePrompt = {
  key: string;
  label: string;
};

export const EXAMPLE_PROMPTS: readonly ExamplePrompt[] = [
  { key: "enduranceRide", label: "examples.enduranceRide" },
  { key: "vo2Intervals", label: "examples.vo2Intervals" },
  { key: "sweetSpot", label: "examples.sweetSpot" },
  { key: "tempoRun", label: "examples.tempoRun" },
];
