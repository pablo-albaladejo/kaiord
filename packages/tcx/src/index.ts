/**
 * @kaiord/tcx - TCX format adapter for Kaiord
 *
 * Provides TCX file reading, writing, and validation capabilities.
 */

export { createTcxProviders } from "./providers";
export type { TcxProviders } from "./providers";

export {
  createFastXmlTcxReader,
  createFastXmlTcxWriter,
} from "./adapters/fast-xml-parser";

export { createXsdTcxValidator } from "./adapters/xsd-validator";
