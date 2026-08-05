/**
 * The neutral ladder every non-zone chart series is drawn from.
 *
 * The five hues in this app mean training zones, so a health, lab or
 * nutrition series painted with one asserts an intensity it cannot mean.
 * Series are told apart by lightness and label instead.
 *
 * Three steps, not four: `--text-disabled` (the next ink role down) resolves
 * to n-400 on the light theme, which is 2.1:1 on the card surface — under the
 * 3:1 floor WCAG 1.4.11 sets for a graphical object. Every step here clears
 * 4.7:1 in both themes. A surface with more series than steps MUST separate
 * the repeats on a second channel (`dash`, point marks, or a separate axis),
 * which is what the health, lab and nutrition charts each do.
 *
 * Resolved per call (like `themedAxis`) because every consumer rebuilds its
 * options inside a `useMemo` keyed on the resolved theme.
 */
import { readThemeColor } from "./chart-theme";

// Role, plus its :root (light) value for the DOM-less path — same convention
// as chart-theme.ts's own two fallbacks.
const LADDER = [
  ["--ink-strong", "#303030"],
  ["--ink-body", "#5b5b5b"],
  ["--ink-muted", "#747474"],
] as const;

/** Ordered stroke ladder for the current theme, most contrast first. */
export const getSeriesStrokes = (): string[] =>
  LADDER.map(([name, fallback]) => readThemeColor(name, fallback));

/** How many distinct steps the ladder offers before it wraps. */
export const SERIES_STROKE_STEPS = LADDER.length;

/**
 * The stroke at `index`, wrapping past the last step. A caller that wraps MUST
 * give the repeated pair a second channel of its own.
 */
export const seriesStroke = (index: number): string => {
  const step = LADDER[index % LADDER.length] ?? LADDER[0];
  return readThemeColor(step[0], step[1]);
};
