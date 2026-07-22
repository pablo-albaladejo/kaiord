import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./test/chrome-mock.js"],
    coverage: {
      include: [
        "background.js",
        "session-fetch.js",
        "kaiord-announce.js",
        "parser.js",
        "bridge-envelope.js",
        "bridge-identity.js",
      ],
      exclude: ["popup.js"],
    },
  },
});
