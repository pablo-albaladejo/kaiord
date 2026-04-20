import type { RepetitionBlock } from "../../../types/krd";

/**
 * Return the inner index of the selected step within a given block, or
 * `undefined` if the selection is elsewhere.
 *
 * Walks the block's own `steps` array looking for the stable `ItemId` —
 * the legacy `step-N` / `block-N-step-M` string parsing is gone. Callers
 * no longer need to know their own `blockIndex` (array position); they
 * pass their block directly.
 */
export function parseSelectedStepIndex(
  selectedStepId: string | null | undefined,
  block: RepetitionBlock | undefined
): number | undefined {
  if (!selectedStepId || !block) return undefined;

  for (let i = 0; i < block.steps.length; i++) {
    const inner = block.steps[i] as { id?: string };
    if (inner.id && inner.id === selectedStepId) return i;
  }
  return undefined;
}
