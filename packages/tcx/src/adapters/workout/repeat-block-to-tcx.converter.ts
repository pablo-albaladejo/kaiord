import type { Logger, RepetitionBlock, Sport, WorkoutStep } from "@kaiord/core";
import { isRepetitionBlock } from "@kaiord/core";

import { convertStepToTcx } from "./step-to-tcx.converter";

type RepeatBlockResult = {
  tcxStep: Record<string, unknown>;
  // Number of sequential TCX StepIds the block occupies (the Repeat_t itself
  // plus one per child), so the caller can keep numbering later siblings.
  consumed: number;
};

// KRD repetition blocks map to a TCX `Repeat_t` step whose `Repetitions`
// carries the repeat count and whose `Child` steps are the (leaf) inner steps.
// StepIds are a single running sequence across the flattened tree, matching
// how native TCX writers number the Repeat_t and its children.
export const convertRepeatBlockToTcx = (
  block: RepetitionBlock,
  startIndex: number,
  sport: Sport,
  logger: Logger
): RepeatBlockResult => {
  logger.debug("Converting repetition block to TCX", {
    repeatCount: block.repeatCount,
  });

  const children = block.steps.map((child, childOffset) =>
    convertStepToTcx(child, startIndex + 1 + childOffset, sport, logger)
  );

  const tcxStep: Record<string, unknown> = {
    "@_xsi:type": "Repeat_t",
    StepId: startIndex + 1,
    Repetitions: block.repeatCount,
    Child: children,
  };

  return { tcxStep, consumed: 1 + children.length };
};

// Walks the KRD step union, emitting flat leaf steps and `Repeat_t` blocks
// while assigning a single, contiguous StepId sequence across both.
export const buildTcxSteps = (
  steps: Array<WorkoutStep | RepetitionBlock>,
  sport: Sport,
  logger: Logger
): Array<Record<string, unknown>> => {
  const tcxSteps: Array<Record<string, unknown>> = [];
  let nextIndex = 0;

  for (const step of steps) {
    if (isRepetitionBlock(step)) {
      const { tcxStep, consumed } = convertRepeatBlockToTcx(
        step,
        nextIndex,
        sport,
        logger
      );
      tcxSteps.push(tcxStep);
      nextIndex += consumed;
    } else {
      tcxSteps.push(convertStepToTcx(step, nextIndex, sport, logger));
      nextIndex += 1;
    }
  }

  return tcxSteps;
};
