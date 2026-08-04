import { getStepColor } from "../../../../utils/step-colors";

/**
 * A `<canvas>` cannot resolve `var(--zone-3)`, and freezing a hex mirror of
 * the ramp would render one theme's zones on the other and go stale the
 * moment the palette moves. So the role is resolved against the live
 * document at draw time — the same value the DOM would have painted.
 */
const VAR_PATTERN = /^var\((--[\w-]+)\)$/;

/** Neutral, theme-agnostic. Used only when there is no document to ask
    (SSR, jsdom without the stylesheet). */
const UNRESOLVED = "#6b7280";

export function resolveCssColor(value: string): string {
  const name = VAR_PATTERN.exec(value)?.[1];
  if (!name) return value;
  if (typeof document === "undefined") return UNRESOLVED;

  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return resolved || UNRESOLVED;
}

export function resolveStepColor(step: unknown): string {
  return resolveCssColor(getStepColor(step));
}
