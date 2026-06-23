// Size-limit config for @kaiord packages.
//
// Converted from `.size-limit.json` to `.size-limit.cjs` because
// `@size-limit/esbuild` requires `modifyEsbuildConfig` to be a function
// (it is invoked as `check.modifyEsbuildConfig(esbuildConfig)`), which
// JSON cannot express. The function form mutates the provided esbuild
// config to mark peer/runtime deps as external so the measurement only
// reflects each package's own contribution.

/** @param {string[]} external */
const externalize = (external) => (config) => {
  config.external = [...(config.external ?? []), ...external];
  // All @kaiord packages are node libraries (CLI / MCP / domain libs):
  // tell esbuild to target node so built-ins like fs/path/crypto resolve
  // without being bundled.
  config.platform = "node";
  return config;
};

module.exports = [
  {
    name: "@kaiord/core",
    path: "packages/core/dist/index.js",
    limit: "35 kB",
    import: "*",
    modifyEsbuildConfig: externalize(["zod"]),
  },
  {
    name: "@kaiord/fit",
    path: "packages/fit/dist/index.js",
    limit: "70 kB",
    import: "*",
    modifyEsbuildConfig: externalize(["@garmin/fitsdk", "zod", "@kaiord/core"]),
  },
  {
    name: "@kaiord/tcx",
    path: "packages/tcx/dist/index.js",
    limit: "30 kB",
    import: "*",
    modifyEsbuildConfig: externalize([
      "fast-xml-parser",
      "zod",
      "@kaiord/core",
    ]),
  },
  {
    name: "@kaiord/zwo",
    path: "packages/zwo/dist/index.js",
    limit: "45 kB",
    import: "*",
    modifyEsbuildConfig: externalize([
      "fast-xml-parser",
      "xsd-schema-validator",
      "zod",
      "@kaiord/core",
    ]),
  },
  {
    name: "@kaiord/garmin",
    path: "packages/garmin/dist/index.js",
    limit: "30 kB",
    import: "*",
    modifyEsbuildConfig: externalize(["zod", "@kaiord/core"]),
  },
  {
    name: "@kaiord/garmin-connect",
    path: "packages/garmin-connect/dist/index.js",
    limit: "25 kB",
    import: "*",
    modifyEsbuildConfig: externalize([
      "fetch-cookie",
      "oauth-1.0a",
      "zod",
      "@kaiord/core",
      "@kaiord/garmin",
    ]),
  },
  {
    name: "@kaiord/ai",
    path: "packages/ai/dist/index.js",
    // Baseline at 55 kB. The `createChatAgent` chat engine (add-spa-ai-chatbot)
    // adds the multi-step tool-calling loop and pulls in `streamText`, taking
    // the bundle just past the prior 50 kB baseline; 55 kB restores headroom
    // as the regression-detection baseline.
    limit: "55 kB",
    import: "*",
    modifyEsbuildConfig: externalize(["zod", "@kaiord/core"]),
  },
  {
    name: "@kaiord/mcp",
    path: "packages/mcp/dist/index.js",
    limit: "35 kB",
    import: "*",
    modifyEsbuildConfig: externalize([
      "@modelcontextprotocol/sdk",
      "zod",
      "@kaiord/core",
      "@kaiord/fit",
      "@kaiord/tcx",
      "@kaiord/zwo",
      "@kaiord/garmin",
      "@kaiord/garmin-connect",
    ]),
  },
];
