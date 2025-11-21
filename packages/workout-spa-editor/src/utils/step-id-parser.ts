/**
 * Step ID Parser Utility
 *
 * Provides functions to parse and reconstruct step IDs in the workout editor.
 * Supports three ID formats:
 * - Main workout steps: "step-{index}"
 * - Block steps: "block-{blockIndex}-step-{stepIndex}"
 * - Repetition blocks: "block-{index}"
 */

/**
 * Parsed components of a step ID
 */
export type StepIdParts = {
  type: "step" | "block";
  blockIndex?: number;
  stepIndex?: number;
};

/**
 * Parses a step ID into its component parts
 *
 * @param id - The step ID to parse
 * @returns Parsed components of the ID
 * @throws Error if the ID format is invalid
 *
 * @example
 * parseStepId("step-1") // { type: 'step', stepIndex: 1 }
 * parseStepId("block-2-step-1") // { type: 'step', blockIndex: 2, stepIndex: 1 }
 * parseStepId("block-2") // { type: 'block', blockIndex: 2 }
 */
export function parseStepId(id: string): StepIdParts {
  if (!id || typeof id !== "string") {
    throw new Error(`Invalid step ID format: ${id}`);
  }

  const parts = id.split("-");

  // Format: "block-{blockIndex}-step-{stepIndex}"
  if (parts[0] === "block" && parts.length === 4 && parts[2] === "step") {
    const blockIndex = Number.parseInt(parts[1], 10);
    const stepIndex = Number.parseInt(parts[3], 10);

    if (Number.isNaN(blockIndex) || Number.isNaN(stepIndex)) {
      throw new Error(`Invalid step ID format: ${id}`);
    }

    return {
      type: "step",
      blockIndex,
      stepIndex,
    };
  }

  // Format: "step-{stepIndex}"
  if (parts[0] === "step" && parts.length === 2) {
    const stepIndex = Number.parseInt(parts[1], 10);

    if (Number.isNaN(stepIndex)) {
      throw new Error(`Invalid step ID format: ${id}`);
    }

    return {
      type: "step",
      stepIndex,
    };
  }

  // Format: "block-{blockIndex}"
  if (parts[0] === "block" && parts.length === 2) {
    const blockIndex = Number.parseInt(parts[1], 10);

    if (Number.isNaN(blockIndex)) {
      throw new Error(`Invalid step ID format: ${id}`);
    }

    return {
      type: "block",
      blockIndex,
    };
  }

  throw new Error(`Invalid step ID format: ${id}`);
}

/**
 * Reconstructs a step ID from its parsed components
 *
 * @param parts - The parsed components of the ID
 * @returns The reconstructed step ID string
 * @throws Error if the parts are invalid
 *
 * @example
 * reconstructStepId({ type: 'step', stepIndex: 1 }) // "step-1"
 * reconstructStepId({ type: 'step', blockIndex: 2, stepIndex: 1 }) // "block-2-step-1"
 * reconstructStepId({ type: 'block', blockIndex: 2 }) // "block-2"
 */
export function reconstructStepId(parts: StepIdParts): string {
  if (parts.type === "step") {
    // Block step: "block-{blockIndex}-step-{stepIndex}"
    if (parts.blockIndex !== undefined && parts.stepIndex !== undefined) {
      return `block-${parts.blockIndex}-step-${parts.stepIndex}`;
    }

    // Main workout step: "step-{stepIndex}"
    if (parts.stepIndex !== undefined) {
      return `step-${parts.stepIndex}`;
    }

    throw new Error("Invalid step ID parts: missing stepIndex");
  }

  if (parts.type === "block") {
    // Repetition block: "block-{blockIndex}"
    if (parts.blockIndex !== undefined) {
      return `block-${parts.blockIndex}`;
    }

    throw new Error("Invalid step ID parts: missing blockIndex");
  }

  throw new Error(`Invalid step ID parts: unknown type ${parts.type}`);
}
