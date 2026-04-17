import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALL_EXTENSIONS = ["garmin-bridge", "train2go-bridge"];

const requested = process.argv[2];
const extensions = requested ? [requested] : ALL_EXTENSIONS;

for (const extName of extensions) {
  const pkgDir = join(__dirname, "..", "packages", extName);
  const pkgPath = join(pkgDir, "package.json");
  const manifestPath = join(pkgDir, "manifest.json");
  const manifestProdPath = join(pkgDir, "manifest.prod.json");

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    console.error(`ERROR: cannot read ${pkgPath}`);
    process.exit(1);
  }

  if (!pkg.version) {
    console.error(`ERROR: no version field in ${pkgPath}`);
    process.exit(1);
  }

  const version = pkg.version;
  const parts = version.split(".");
  const validCws =
    parts.length >= 1 &&
    parts.length <= 4 &&
    parts.every((p) => /^(0|[1-9]\d*)$/.test(p) && Number(p) <= 65535);

  if (!validCws) {
    console.error(
      `ERROR: invalid Chrome extension version "${version}" in ${pkgPath}`
    );
    process.exit(1);
  }

  console.log(`[${extName}] version ${version}`);
  let changed = false;

  for (const path of [manifestPath, manifestProdPath]) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      console.error(`ERROR: cannot parse ${path}`);
      process.exit(1);
    }

    if (manifest.version === version) {
      console.log(`  ${path}: already ${version}`);
      continue;
    }

    const old = manifest.version;
    const text = readFileSync(path, "utf8");
    const updated = text.replace(
      /"version":\s*"[^"]*"/,
      `"version": "${version}"`
    );
    writeFileSync(path, updated);
    console.log(`  ${path}: ${old} → ${version}`);
    changed = true;
  }

  // Sync the BRIDGE_MANIFEST.version literal inside background.js so the
  // value the extension reports to the SPA via the `ping` action stays in
  // lockstep with the published manifest version. Without this, the SPA's
  // "Update your extension" detection runs against a stale version.
  //
  // Fail loudly if background.js exists but its BRIDGE_MANIFEST literal
  // cannot be located — that means a future refactor moved/renamed the
  // constant and the sync is silently broken. Catching it here is much
  // cheaper than discovering it post-publish via SPA bridge-registry.
  const backgroundPath = join(pkgDir, "background.js");
  let backgroundText;
  try {
    backgroundText = readFileSync(backgroundPath, "utf8");
  } catch {
    backgroundText = null;
  }
  if (backgroundText !== null) {
    const probeRe = /BRIDGE_MANIFEST[\s\S]*?version:\s*"([^"]*)"/;
    const probe = probeRe.exec(backgroundText);
    if (!probe) {
      console.error(
        `ERROR: ${backgroundPath} exists but does not contain a "BRIDGE_MANIFEST … version: \"…\"" literal — sync cannot proceed. Either restore the constant or remove this guard from sync-extension-version.mjs.`
      );
      process.exit(1);
    }
    const oldVersion = probe[1];
    if (oldVersion === version) {
      console.log(`  ${backgroundPath}: BRIDGE_MANIFEST already ${version}`);
    } else {
      const updated = backgroundText.replace(
        probeRe,
        (match, _v) => match.replace(/version:\s*"[^"]*"/, `version: "${version}"`)
      );
      writeFileSync(backgroundPath, updated);
      console.log(`  ${backgroundPath}: ${oldVersion} → ${version}`);
      changed = true;
    }
  }

  if (changed) {
    console.log(`Synced ${extName} manifest versions to ${version}`);
  } else {
    console.log(`${extName}: all versions already at ${version}`);
  }
}
