import { hide } from "./estimate-zone-profile-hide";
import type { EstimatedSegment, Step } from "./estimate-zone-profile-types";

const MAX_SEGMENTS = 300;

const push = (out: Array<EstimatedSegment>, segment: EstimatedSegment) => {
  out.push(segment);
  if (out.length > MAX_SEGMENTS) hide();
};

// Checked while expanding, so "99x(99x(99x(…)))" stops at the cap.
const flattenInto = (steps: Array<Step>, out: Array<EstimatedSegment>) => {
  for (const step of steps) {
    if (step.kind === "timed") {
      push(out, { zone: step.zone, seconds: step.seconds });
      continue;
    }
    for (let i = 0; i < step.count; i++) {
      flattenInto(step.body, out);
      if (i < step.count - 1) flattenInto(step.between, out);
    }
  }
};

export const flattenSteps = (steps: Array<Step>): Array<EstimatedSegment> => {
  const out: Array<EstimatedSegment> = [];
  flattenInto(steps, out);
  return out;
};

export const totalSeconds = (segments: Array<EstimatedSegment>): number =>
  segments.reduce((sum, segment) => sum + segment.seconds, 0);

export const mergeSegments = (
  segments: Array<EstimatedSegment>
): Array<EstimatedSegment> => {
  const merged: Array<EstimatedSegment> = [];
  for (const segment of segments) {
    const last = merged.at(-1);
    if (last && last.zone === segment.zone) last.seconds += segment.seconds;
    else merged.push({ ...segment });
  }
  return merged;
};
