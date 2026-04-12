import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = join(__dirname, "..", "packages", "garmin-bridge");

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
  manifest.version = version;
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`  ${path}: ${old} → ${version}`);
  changed = true;
}

if (changed) {
  console.log(`Synced manifest versions to ${version}`);
} else {
  console.log(`All versions already at ${version}`);
}
