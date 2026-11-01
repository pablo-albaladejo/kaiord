// Keeps packages/mcp/server.json (the MCP Registry entry) and the published
// server card on the version of @kaiord/mcp. The registry never accepts a
// version twice, so a server.json left behind on the previous release cannot
// be published at all; a stale card tells agents the wrong version.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NPM_IDENTIFIER = "@kaiord/mcp";
const JSON_INDENT = 2;
const CARD_PATH = [
  "packages",
  "landing",
  "public",
  ".well-known",
  "mcp",
  "server-card.json",
];

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

export function syncCardVersion(card, version) {
  if (!card.serverInfo) throw new Error("server-card.json has no serverInfo");
  const changed =
    card.version !== version || card.serverInfo.version !== version;
  card.version = version;
  card.serverInfo.version = version;
  return changed;
}

function syncFile(path, version, sync) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  const changed = sync(json, version);
  if (changed)
    writeFileSync(path, `${JSON.stringify(json, null, JSON_INDENT)}\n`);
  return changed;
}

export function syncMcpServerVersion(root) {
  const pkgDir = join(root, "packages", "mcp");
  const { version } = JSON.parse(
    readFileSync(join(pkgDir, "package.json"), "utf8")
  );
  if (!version) throw new Error("packages/mcp/package.json has no version");
  const server = syncFile(
    join(pkgDir, "server.json"),
    version,
    syncServerVersion
  );
  const card = syncFile(join(root, ...CARD_PATH), version, syncCardVersion);
  return { version, changed: server || card };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2] ?? join(dirname(process.argv[1]), "..");
  try {
    const { version, changed } = syncMcpServerVersion(root);
    console.log(
      `[mcp] server.json + server card ${changed ? "synced to" : "already at"} ${version}`
    );
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}
