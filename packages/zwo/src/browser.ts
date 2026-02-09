/**
 * Browser-specific entry point for @kaiord/zwo
 * Excludes Node.js-specific XSD validation to avoid bundling Node.js modules
 */

export { createZwoProviders } from "./providers-browser";
export type { ZwoProviders } from "./providers-browser";

export {
  createFastXmlZwiftReader,
  createFastXmlZwiftWriter,
} from "./adapters/fast-xml-parser";

// Only export createZwiftValidator (browser-compatible), not createXsdZwiftValidator
export { createZwiftValidator } from "./adapters/xsd-validator-browser";
