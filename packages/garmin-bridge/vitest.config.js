import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./test/chrome-mock.js"],
    coverage: {
      include: ["background.js", "content.js", "kaiord-announce.js"],
      exclude: ["popup.js"],
    },
  },
});
