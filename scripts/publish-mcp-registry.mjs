// Publish packages/mcp/server.json to the MCP Registry once the matching
// @kaiord/mcp version is on npm. Fails (never silently skips) otherwise.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY = "https://registry.modelcontextprotocol.io/v0/servers";

const waitForNpm = async ({
  exec,
  sleep,
  log,
  version,
  attempts,
  intervalMs,
}) => {
  for (let i = 1; i <= attempts; i++) {
    try {
      exec("npm", ["view", `@kaiord/mcp@${version}`, "version"]);
      log(`@kaiord/mcp@${version} is on npm`);
      return;
    } catch {
      log(`@kaiord/mcp@${version} not on npm (attempt ${i}/${attempts})`);
      if (i < attempts) await sleep(intervalMs);
    }
  }
  throw new Error(
    `@kaiord/mcp@${version} not on npm after ${attempts} attempts`
  );
};

export const publishMcpRegistry = async ({
  root,
  exec,
  fetch,
  sleep,
  log,
  publisher = process.env.MCP_PUBLISHER ?? "mcp-publisher",
  attempts = 20,
  intervalMs = 30000,
}) => {
  const dir = join(root, "packages", "mcp");
  const { name, version } = JSON.parse(
    readFileSync(join(dir, "server.json"), "utf8")
  );
  await waitForNpm({ exec, sleep, log, version, attempts, intervalMs });

  const url = `${REGISTRY}/${encodeURIComponent(name)}/versions/${version}`;
  const { status } = await fetch(url);
  if (status === 200) return log(`already registered ${version}`);
  if (status !== 404) {
    throw new Error(
      `MCP Registry lookup for ${version} returned HTTP ${status}`
    );
  }
  log(`${version} not registered (HTTP 404); publishing`);
  exec(publisher, ["login", "github-oidc"], { cwd: dir });
  exec(publisher, ["publish"], { cwd: dir });
  log(`published ${version}`);
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  publishMcpRegistry({
    root,
    exec: (cmd, args, opts = {}) =>
      execFileSync(cmd, args, { stdio: "inherit", ...opts }),
    fetch: globalThis.fetch,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: (m) => console.log(m),
  }).catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
