import { findDurations } from "./estimate-zone-profile-duration";
import {
  CONNECTOR,
  GROUP_CHUNK,
  NESTING,
  SET_REST,
  setRestStep,
  SUB_STEP,
  THEN,
  TRAILING_MAX_STEPS,
  TRAILING_REPEAT,
} from "./estimate-zone-profile-grammar";
import { hide } from "./estimate-zone-profile-hide";
import { maskGroups } from "./estimate-zone-profile-mask";
import { parsePart } from "./estimate-zone-profile-parts";
import type { Sink } from "./estimate-zone-profile-sink";
import { addSetRest, addStep, createSink } from "./estimate-zone-profile-sink";
import { splitAtTokens } from "./estimate-zone-profile-split";
import type { GroupParse, Step } from "./estimate-zone-profile-types";

// A step or repeat joined by "con"/"with" to a plain timed step is a
// sub-step whose place inside the parent is unknown.
function addParts(text: string, groups: Array<string>, sink: Sink): void {
  const pieces = text.split(CONNECTOR);
  let previous: Step | undefined;
  for (let i = 0; i < pieces.length; i += 2) {
    const connector = (pieces[i - 1] ?? "").trim();
    splitAtTokens(pieces[i] ?? "").forEach((part, j) => {
      const parsed = parsePart(part.trim(), groups, parseGroup);
      if (!parsed) return;
      const nested =
        j === 0 && SUB_STEP.test(connector) && previous?.kind === "timed";
      if (nested && !sink.open) hide();
      addStep(sink, parsed, part, j === 0 && connector === "/");
      previous = parsed.step;
    });
  }
}

// "a then b and c x4" repeats the steps after the last then/luego, or the
// whole chunk when there is none; more than two repeated steps is ambiguous.
function addTrailingRepeat(
  body: string,
  count: number,
  groups: Array<string>,
  sink: Sink
): void {
  const then = [...body.matchAll(THEN)].at(-1);
  const head = then ? body.slice(0, then.index) : "";
  if (head.trim()) addParts(head, groups, sink);
  const local = createSink(false);
  const tail = then ? body.slice(then.index + then[0].length) : body;
  addParts(tail, groups, local);
  const repeated = local.steps;
  const size = repeated.length;
  if (count < 1 || size === 0 || size > TRAILING_MAX_STEPS) hide();
  sink.steps.push({ kind: "repeat", count, body: repeated, between: [] });
  sink.open = undefined;
}

export function processChunk(
  chunk: string,
  groups: Array<string>,
  sink: Sink
): void {
  const text = chunk.trim();
  const setRest = SET_REST.exec(text);
  if (setRest) return addSetRest(sink, setRestStep(setRest[1] ?? ""));
  const nesting = NESTING.exec(text);
  if (nesting && findDurations(text.slice(nesting.index)).length > 0) hide();
  const trailing = TRAILING_REPEAT.exec(text);
  if (!trailing) return addParts(text, groups, sink);
  const body = text.slice(0, trailing.index);
  addTrailingRepeat(body, Number(trailing[1]), groups, sink);
}

function parseGroup(text: string): GroupParse {
  const { masked, groups } = maskGroups(text);
  const sink = createSink(true);
  for (const chunk of masked.split(GROUP_CHUNK)) {
    processChunk(chunk, groups, sink);
  }
  return { steps: sink.steps, rest: sink.rest ?? [] };
}
