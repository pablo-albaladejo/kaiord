import { printable } from "./stray-plugins";

/**
 * The one tool the CLI adds for `--json-schema` (observed on CLI 2.1.310):
 * it carries the structured answer back, so a call that asks for one may
 * load it once. A call without a schema may load no tool at all.
 */
export const STRUCTURED_OUTPUT_TOOL = "StructuredOutput";

/** The name of every tool in the init message the call did not ask for. */
export const strayTools = (
  tools: ReadonlyArray<unknown>,
  options: { structuredOutput: boolean }
): Array<string> => {
  let allowance = options.structuredOutput ? 1 : 0;
  return tools.flatMap((tool) => {
    if (tool === STRUCTURED_OUTPUT_TOOL && allowance > 0) {
      allowance -= 1;
      return [];
    }
    return [printable(tool) ?? "<unrecognized tool entry>"];
  });
};
