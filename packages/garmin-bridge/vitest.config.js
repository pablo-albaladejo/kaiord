import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./test/chrome-mock.js"],
    coverage: {
      include: [
        "background.js",
        "garmin-oauth.js",
        "kaiord-announce.js",
        "bridge-envelope.js",
        "bridge-identity.js",
      ],
      exclude: ["popup.js"],
    },
  },
});
