import { parseStepId } from "../../../utils/step-id-parser";

/**
 * Extract selected step index from a step ID string.
 * Handles hierarchical ID format: "step-{index}" or "block-{blockIndex}-step-{stepIndex}".
 * Returns undefined if the step does not belong to the given block.
 */
export function parseSelectedStepIndex(
  selectedStepId: string | null | undefined,
  parentBlockIndex: number
): number | undefined {
  if (!selectedStepId) return undefined;

  try {
    const parsed = parseStepId(selectedStepId);

    if (parsed.type !== "step") return undefined;

    // Only select steps that belong to this specific block
    if (
      parsed.blockIndex !== undefined &&
      parsed.blockIndex === parentBlockIndex
    ) {
      return parsed.stepIndex;
    }

    return undefined;
  } catch (error) {
    console.warn("Failed to parse step ID:", selectedStepId, error);
    return undefined;
  }
}
