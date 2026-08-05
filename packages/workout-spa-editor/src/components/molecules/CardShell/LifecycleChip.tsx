/**
 * The session's lifecycle, as a word.
 *
 * It used to be a coloured glyph (`⚠️` amber for raw, `★` green for ready)
 * beside the title, duplicating the lateral border in two hues the palette no
 * longer carries. The border now says the zone; this says the state, in the
 * language the user reads elsewhere in the app.
 *
 * `attention` is the only emphasis level: a state that needs the user says so
 * with full ink and a firmer edge, and every other state stays quiet
 * (principle 2). There is no success colour, by design.
 */

const TONE = {
  attention: "border-edge text-ink-strong",
  quiet: "border-edge-soft text-ink-muted",
} as const;

export type LifecycleChipTone = keyof typeof TONE;

export type LifecycleChipProps = {
  label: string;
  tone?: LifecycleChipTone;
  testId?: string;
};

export function LifecycleChip({
  label,
  tone = "quiet",
  testId,
}: LifecycleChipProps) {
  return (
    <span
      data-testid={testId}
      className={`shrink-0 rounded-full border px-2 py-px text-[11px] font-medium tabular-nums ${TONE[tone]}`}
    >
      {label}
    </span>
  );
}
