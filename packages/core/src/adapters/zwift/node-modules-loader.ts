// Check if we're in a Node.js environment
// This check works in both Node.js and bundlers that polyfill process
const isNode =
  typeof process !== "undefined" &&
  (process.versions?.node || typeof process.env !== "undefined");

// Lazy load Node.js modules only when needed
let validateXML:
  | ((
      xml: string,
      schema: string
    ) => Promise<{
      valid: boolean;
      messages: string[];
      result?: string;
    }>)
  | null = null;
let XSD_SCHEMA_PATH: string | null = null;

export const loadNodeModules = async () => {
  if (!isNode) {
    throw new Error("XSD validation is only available in Node.js environments");
  }

  if (validateXML && XSD_SCHEMA_PATH) {
    return { validateXML, XSD_SCHEMA_PATH };
  }

  const { createRequire } = await import("module");
  const { dirname, join } = await import("path");
  const { fileURLToPath } = await import("url");

  const require = createRequire(import.meta.url);
  const { validateXML: validateXMLFn } = require("xsd-schema-validator") as {
    validateXML: (
      xml: string,
      schema: string
    ) => Promise<{
      valid: boolean;
      messages: string[];
      result?: string;
    }>;
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, "../../../schema/zwift-workout.xsd");

  validateXML = validateXMLFn;
  XSD_SCHEMA_PATH = schemaPath;

  return { validateXML, XSD_SCHEMA_PATH };
};
