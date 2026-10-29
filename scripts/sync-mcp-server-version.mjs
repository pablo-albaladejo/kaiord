// Keeps packages/mcp/server.json (the MCP Registry entry) on the version of
// @kaiord/mcp. The registry never accepts a version twice, so a server.json
// left behind on the previous release cannot be published at all.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NPM_IDENTIFIER = "@kaiord/mcp";
const JSON_INDENT = 2;

export function syncServerVersion(server, version) {
  const npm = (server.packages ?? []).find(
    (p) => p.registryType === "npm" && p.identifier === NPM_IDENTIFIER
  );
  if (!npm) throw new Error(`server.json has no npm package ${NPM_IDENTIFIER}`);
  const changed = server.version !== version || npm.version !== version;
  server.version = version;
  npm.version = version;
  return changed;
}

export function syncMcpServerVersion(root) {
  const pkgDir = join(root, "packages", "mcp");
  const { version } = JSON.parse(
    readFileSync(join(pkgDir, "package.json"), "utf8")
  );
  if (!version) throw new Error("packages/mcp/package.json has no version");
  const serverPath = join(pkgDir, "server.json");
  const server = JSON.parse(readFileSync(serverPath, "utf8"));
  const changed = syncServerVersion(server, version);
  if (changed)
    writeFileSync(serverPath, `${JSON.stringify(server, null, JSON_INDENT)}\n`);
  return { version, changed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? join(dirname(process.argv[1]), "..");
  try {
    const { version, changed } = syncMcpServerVersion(root);
    console.log(
      `[mcp] server.json ${changed ? "synced to" : "already at"} ${version}`
    );
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
