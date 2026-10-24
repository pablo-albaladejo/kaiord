import { parseStepDuration } from "./estimate-zone-profile-duration";
import { hide } from "./estimate-zone-profile-hide";
import type { Step } from "./estimate-zone-profile-types";
import { explicitZone } from "./estimate-zone-profile-zone";

export const SET_REST = /^(?:r|rest|rec|recuperacion|descanso)\s*:\s*(.*)$/;

// A connector before a group ("30' con (…)") introduces that span's detail.
export const CONNECTOR =
  /(\+|\/|\b(?:with|con|then|luego|and|y)\b(?!\s*[\ue000-\uf8ff]))/;
export const SUB_STEP = /^(?:with|con)$/;
// "after 20'" places a span before the text that names it, so its order
// is as unknown as a nested sub-step's place.
export const NESTING =
  /\b(?:including|incluyendo|incluye|de los cuales|de las cuales|of which|the last|last|los ultimos|las ultimas|after)\b/;
export const TRAILING_REPEAT = /\s+x\s*(\d{1,2})\s*$/;
export const THEN = /\b(?:then|luego)\b/g;
export const GROUP_CHUNK = /;|(?<!\d),|,(?!\d)|\s-\s|\.(?=\s|$)/;
export const TRAILING_MAX_STEPS = 2;

export const setRestStep = (text: string): Step => ({
  kind: "timed",
  seconds: parseStepDuration(text) ?? hide(),
  zone: explicitZone(text) ?? 1,
});
