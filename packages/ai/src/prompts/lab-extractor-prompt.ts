import { definePrompt } from "./registry";
import labExtractorRaw from "./lab-extractor.md";

/**
 * The lab-extractor system prompt: extracts structured parameters from a lab
 * report document. `{{parameters}}` is the catalog listing, injected at agent
 * construction time (static — the catalog does not change at runtime).
 */
export const LAB_EXTRACTOR_SYSTEM = definePrompt({
  id: "lab-extractor/system",
  version: "1.0.0",
  template: labExtractorRaw,
  variables: ["parameters"],
});
