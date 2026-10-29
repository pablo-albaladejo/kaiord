// The Vitest suites import the sources under Node, so they never see the
// esbuild bundle. This boots the real bundle in local workerd, where a
// module-load crash (see src/load-at-startup.ts) stops the runtime before any
// request is served. It runs under plain node:test because Vitest's
// `browser` resolve condition breaks wrangler's own `ws` import.
import { strict as assert } from "node:assert";
import { after, before, test } from "node:test";
import { join } from "node:path";

import { unstable_dev } from "wrangler";

const ENTRY = join(import.meta.dirname, "..", "src", "worker.ts");
const CONFIG = join(import.meta.dirname, "..", "wrangler.toml");
// A bundle that crashes at module load never becomes ready; fail, not hang.
const BOOT_TIMEOUT_MS = 60_000;
const HTTP_OK = 200;
const REMOTE_TOOL_COUNT = 8;

let worker;

before(
  async () => {
    worker = await unstable_dev(ENTRY, {
      config: CONFIG,
      logLevel: "none",
      experimental: { disableExperimentalWarning: true },
    });
  },
  { timeout: BOOT_TIMEOUT_MS }
);

after(async () => {
  await worker?.stop();
});

test("should boot the bundle in workerd and list the remote tools", async () => {
  // Arrange
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" });

  // Act
  const response = await worker.fetch("/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body,
  });
  const payload = await response.json();

  // Assert
  assert.equal(response.status, HTTP_OK);
  assert.equal(payload.result.tools.length, REMOTE_TOOL_COUNT);
});
