import { LAB_PARAMETER_CATALOG } from "@kaiord/core";
import { LAB_EXTRACTOR_SYSTEM } from "../prompts/lab-extractor-prompt";
import {
  labExtractionSchema,
  type LabExtraction,
} from "./lab-extraction-schema";
import type { AgentDefinition } from "./definition-types";

/** Compact "key (unit)" listing of the canonical catalog for the prompt. */
const catalogListing = (): string =>
  LAB_PARAMETER_CATALOG.map((p) => `${p.key} (${p.canonicalUnit})`).join(", ");

/**
 * The shipped lab-extractor definition: reads a lab-report document and returns
 * a permissive extraction the SPA maps to catalog parameters for review.
 */
export const labExtractorAgent: AgentDefinition<LabExtraction> = {
  id: "lab-extractor",
  version: LAB_EXTRACTOR_SYSTEM.version,
  purpose: "lab_extraction",
  systemPrompt: {
    id: LAB_EXTRACTOR_SYSTEM.id,
    vars: { parameters: catalogListing() },
  },
  mode: "generate",
  outputSchema: labExtractionSchema,
};
