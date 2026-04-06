import type { Node } from "constructs";

export const parseAllowedOrigins = (node: Node): string[] => {
  const rawOrigins = node.tryGetContext("allowedOrigins") as
    | string
    | string[]
    | undefined;

  if (Array.isArray(rawOrigins)) return rawOrigins;

  if (typeof rawOrigins === "string") {
    try {
      const parsed: unknown = JSON.parse(rawOrigins);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
        return parsed as string[];
      }
    } catch {
      // invalid JSON, fall through to error
    }
  }

  throw new Error(
    "Missing or invalid CDK context: allowedOrigins. " +
      "Provide --context allowedOrigins='[\"https://example.com\"]'"
  );
};
