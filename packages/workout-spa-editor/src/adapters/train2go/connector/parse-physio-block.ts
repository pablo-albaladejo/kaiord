import { extractInputValueAsNumber } from "./details-inputs";
import { sliceBetween } from "./details-slices";
import type { Train2GoPhysiological } from "./train2go-zones-payload";

export const parsePhysioBlock = (
  html: string
): Train2GoPhysiological | null => {
  const block = sliceBetween(html, /id="physio-\d+"/, "</form>");
  if (!block) return null;
  const out: Train2GoPhysiological = {};
  const weight = extractInputValueAsNumber(block, "weight");
  const bpmMax = extractInputValueAsNumber(block, "bpm_max");
  const bpmRest = extractInputValueAsNumber(block, "bpm_rest");
  if (typeof weight === "number") out.weight = weight;
  if (typeof bpmMax === "number") out.bpmMax = bpmMax;
  if (typeof bpmRest === "number") out.bpmRest = bpmRest;
  return Object.keys(out).length > 0 ? out : null;
};
