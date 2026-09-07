import type { StorybookConfig } from "@storybook/react-vite";
import { createRequire } from "module";
import { dirname, join } from "path";

// The package is `"type": "module"`, so this config loads as ESM and the bare
// `require` this helper used to call is not defined there — Storybook failed
// every build with `SB_CORE-SERVER_0002 (CriticalPresetLoadError)`.
const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [getAbsolutePath("@storybook/addon-a11y")],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  docs: {},
  typescript: {
    // Not "react-docgen-typescript": that plugin drives the TS compiler host
    // directly and crashes on this repo's TypeScript 7 with
    // `Cannot read properties of undefined (reading 'fileExists')`, failing
    // the whole build. The babel-based extractor is TS-version-independent.
    reactDocgen: "react-docgen",
  },
};

export default config;
