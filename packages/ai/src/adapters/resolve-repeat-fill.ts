import { resolveDuration } from "./resolve-durations";
import type { RawDuration } from "./resolve-durations";

/**
 * "30' con (1' rápido + 2' suave)": a block of a total time filled with a
 * repeated cycle. The model copies the total into `fill`; code counts the
 * WHOLE cycles that fit, so the block never runs past the coach's total.
 */

type RawBlock = {
  fill?: RawDuration;
  repeatCount?: number;
  steps: Array<{ duration?: RawDuration }>;
};

const secondsOf = (d: RawDuration | undefined): number | undefined => {
  if (!d || d.type !== "time") return undefined;
  const seconds = resolveDuration(d).seconds;
  return typeof seconds === "number" && seconds > 0 ? seconds : undefined;
};

export const resolveRepeatFill = <B extends RawBlock>(block: B): B => {
  if (!block.fill) return block;
  const { fill, ...rest } = block;
  const total = secondsOf(fill);
  if (total === undefined) throw new Error("a block fill needs a time total");
  const parts = block.steps.map((s) => secondsOf(s.duration));
  if (parts.length === 0 || parts.some((p) => p === undefined)) {
    throw new Error(
      "a block fill needs every step of the block timed, to know how many cycles fit"
    );
  }
  const cycle = (parts as Array<number>).reduce((a, b) => a + b, 0);
  const repeatCount = Math.floor(total / cycle);
  if (repeatCount < 1) {
    throw new Error(
      `a block fill of ${total} s is shorter than one cycle of ${cycle} s`
    );
  }
  return { ...rest, repeatCount } as unknown as B;
};
