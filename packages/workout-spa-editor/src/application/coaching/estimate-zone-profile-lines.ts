import { processChunk } from "./estimate-zone-profile-chunk";
import {
  findDurations,
  parseStepDuration,
} from "./estimate-zone-profile-duration";
import { flattenSteps, totalSeconds } from "./estimate-zone-profile-flatten";
import { SET_REST } from "./estimate-zone-profile-grammar";
import { hide } from "./estimate-zone-profile-hide";
import { maskGroups } from "./estimate-zone-profile-mask";
import { createSink } from "./estimate-zone-profile-sink";
import { stepText, titleOf } from "./estimate-zone-profile-title";
import { takeTotal, TITLE_COLON } from "./estimate-zone-profile-total";
import type { Step } from "./estimate-zone-profile-types";
import { isSectionLabel } from "./estimate-zone-profile-zone";

const CHUNK = /;|(?<!\d),|,(?!\d)|\.(?=\s|$)/;
const REPEAT = /\b\d{1,2}\s*x\s*(?=\d|\()/;
const TITLE_COLON_G = /(?<!\d):|:(?!\d)/g;

type Titled = { text: string; headline: number | undefined };
export type ParsedLines = { steps: Array<Step>; expected: Array<number> };
export type LinePlan = { body: Array<string>; expected: Array<number> };

const hasDuration = (text: string): boolean => findDurations(text).length > 0;

// Headers are summaries, never segments, and a summary must reconcile with
// the breakdown or nothing is drawn. A colon is a title separator only when
// a step follows it. A duration before it ("Rodillo 1h: …") is a headline
// total, allowed once at the start; otherwise the title's words stay with
// the first step. A first line "Title: …" over more lines summarises them
// unless its title is a section word ("Calentamiento: 15'").
const splitTitle = (chunk: string, isFirst: boolean): Titled => {
  const parts = chunk.split(TITLE_COLON);
  const post = parts.at(-1) ?? "";
  const titles = parts.slice(0, -1);
  const none = { text: chunk, headline: undefined };
  if (titles.length === 0 || SET_REST.test(chunk.trim())) return none;
  if (!hasDuration(post))
    return { ...none, text: chunk.replace(TITLE_COLON_G, " ") };
  if (!titles.some(hasDuration))
    return { ...none, text: titles.join(" ") + ` ${post}` };
  if (!isFirst || titles.length > 1) return hide();
  return { text: post, headline: parseStepDuration(titles[0] ?? "") };
};

export const parseLines = (lines: Array<string>): ParsedLines => {
  const sink = createSink(false);
  const expected: Array<number> = [];
  lines.forEach((line, i) => {
    const { masked, groups } = maskGroups(line);
    masked.split(CHUNK).forEach((chunk, j) => {
      const titled = splitTitle(takeTotal(chunk, expected), i + j === 0);
      if (titled.headline !== undefined) expected.push(titled.headline);
      processChunk(titled.text, groups, sink);
    });
  });
  return { steps: sink.steps, expected };
};

// A first line that restates a later repeat line names the main set and is
// dropped without a total to reconcile; otherwise a section line is a step
// and any other title line is a summary that must reconcile.
export const planLines = (text: string): LinePlan => {
  const body = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const [first, ...rest] = body;
  const title = first === undefined ? undefined : titleOf(first);
  if (first === undefined || rest.length === 0 || title === undefined)
    return { body, expected: [] };
  const restated = stepText(first);
  if (REPEAT.test(restated) && rest.map(stepText).includes(restated))
    return { body: rest, expected: [] };
  if (isSectionLabel(title)) return { body, expected: [] };
  const summary = totalSeconds(flattenSteps(parseLines([first]).steps));
  return { body: rest, expected: [summary] };
};
