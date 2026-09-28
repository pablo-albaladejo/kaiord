#!/usr/bin/env node
// IndexNow for kaiord.com: tells Bing (which feeds Copilot and ChatGPT
// search), Yandex, Seznam and Naver which URLs changed in a deploy. Google
// ignores IndexNow; it reads the sitemap lastmod instead.
//
//   node scripts/geo/indexnow.mjs key
//       Prints the key. The key file is packages/landing/public/<key>.txt,
//       whose content is the key itself (public by design: serving it at the
//       site root is how IndexNow proves ownership). Rotate by replacing it.
//   node scripts/geo/indexnow.mjs diff [--base <submitted.xml…>] --old <live.xml…> --new <built.xml…> --out <urls.txt>
//       Writes the kaiord.com URLs added, removed, or whose <lastmod>
//       changed. The comparison point is BASE (the sitemaps of the last
//       deploy whose submit succeeded), so URLs a failed fetch or submit
//       missed are sent again; without a complete BASE it is OLD (the live
//       sitemaps). A set is complete only if every file exists and lists at
//       least one URL. With neither, it skips with a ::warning:: and an empty
//       list, so a flaky fetch never submits the whole site. A NEW sitemap
//       without any <loc> is a broken build and fails.
//       --keep <file…> (one per --new) copies the built sitemaps there as the
//       next baseline candidate, but only when a comparison point existed: a
//       skipped diff must not let the next deploy start after the changes it
//       never compared.
//   node scripts/geo/indexnow.mjs submit <urls.txt>
//       Empty list: "nothing changed, skipping". Otherwise POSTs to
//       api.indexnow.org and logs "IndexNow <status>"; 200/202 are success,
//       anything else (or a network error) is a ::warning::, never a failure.
//       Writes result=ok|skipped|warned to $GITHUB_OUTPUT when it is set.
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HOST = "kaiord.com";
export const ENDPOINT = "https://api.indexnow.org/indexnow";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC_DIR = join(repoRoot, "packages", "landing", "public");
const KEY_FILE = /^([0-9a-f]{32})\.txt$/;

export function findKey(dir = PUBLIC_DIR) {
  const keys = readdirSync(dir)
    .map((name) => KEY_FILE.exec(name)?.[1])
    .filter(Boolean)
    .filter(
      (key) => readFileSync(join(dir, `${key}.txt`), "utf8").trim() === key
    );
  if (keys.length !== 1) {
    throw new Error(
      `expected exactly one IndexNow key file in ${dir}, found ${keys.length}`
    );
  }
  return keys[0];
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

// One pass, so a decoded "&" is never read again: "&amp;lt;" is "&lt;".
const decode = (text) =>
  text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name) => ENTITIES[name]);

// loc -> lastmod ("" when the entry has none).
export function parseSitemap(xml) {
  const entries = new Map();
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(body)?.[1];
    if (!loc) continue;
    entries.set(
      decode(loc),
      /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/.exec(body)?.[1] ?? ""
    );
  }
  return entries;
}

const isOwnHost = (url) => {
  try {
    return new URL(url).hostname === HOST;
  } catch {
    return false;
  }
};

export function diffSitemaps(oldEntries, newEntries) {
  const changed = [];
  for (const [loc, lastmod] of newEntries) {
    if (oldEntries.get(loc) !== lastmod) changed.push(loc);
  }
  for (const loc of oldEntries.keys()) {
    if (!newEntries.has(loc)) changed.push(loc);
  }
  return changed.filter(isOwnHost).sort();
}

const readAll = (files) => {
  const merged = new Map();
  for (const file of files) {
    for (const [loc, lastmod] of parseSitemap(readFileSync(file, "utf8"))) {
      merged.set(loc, lastmod);
    }
  }
  return merged;
};

// Every file present and non-empty, or nothing: half a comparison point
// would make the other half of the site look new.
const readComplete = (files) => {
  if (files.length === 0 || files.some((f) => !existsSync(f))) return null;
  const maps = files.map((f) => parseSitemap(readFileSync(f, "utf8")));
  return maps.some((m) => m.size === 0) ? null : readAll(files);
};

export function diffFiles({
  baseFiles = [],
  oldFiles,
  newFiles,
  log = console,
}) {
  if (newFiles.length === 0)
    throw new Error("diff needs at least one --new sitemap");
  const fresh = readAll(newFiles);
  if (fresh.size === 0)
    throw new Error(`no <url><loc> in ${newFiles.join(", ")}`);
  const base = readComplete(baseFiles);
  if (base) {
    log.log("IndexNow: diffing against the last submitted sitemaps");
    return diffSitemaps(base, fresh);
  }
  const live = readComplete(oldFiles);
  if (!live) {
    log.warn(
      "::warning::IndexNow: the live sitemap could not be read; skipping this deploy"
    );
    return null;
  }
  log.log(
    "IndexNow: no last submitted sitemaps; diffing against the live ones"
  );
  return diffSitemaps(live, fresh);
}

export async function submit({
  urls,
  key,
  fetch = globalThis.fetch,
  log = console,
  timeoutMs = 20_000,
}) {
  if (urls.length === 0) {
    log.log("IndexNow: nothing changed, skipping");
    return "skipped";
  }
  const body = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urls,
  };
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      // A hung endpoint must not hold the job until its timeout: the abort
      // rejects the fetch, and the catch below turns it into a warning.
      signal: AbortSignal.timeout(timeoutMs),
    });
    log.log(`IndexNow ${response.status} for ${urls.length} URL(s)`);
    if (response.status === 200 || response.status === 202) return "ok";
    log.warn(
      `::warning::IndexNow answered ${response.status}; the URLs were not accepted`
    );
  } catch (error) {
    log.warn(`::warning::IndexNow request failed: ${error.message}`);
  }
  return "warned";
}

const listArg = (argv, flag) => {
  const at = argv.indexOf(flag);
  if (at === -1) return [];
  const values = [];
  for (const value of argv.slice(at + 1)) {
    if (value.startsWith("--")) break;
    values.push(value);
  }
  return values;
};

async function main(argv) {
  const [command] = argv;
  if (command === "key") {
    console.log(findKey());
  } else if (command === "diff") {
    const [out] = listArg(argv, "--out");
    if (!out) throw new Error("diff needs --out <file>");
    const newFiles = listArg(argv, "--new");
    const keep = listArg(argv, "--keep");
    if (keep.length !== 0 && keep.length !== newFiles.length)
      throw new Error("diff needs one --keep file per --new sitemap");
    const urls = diffFiles({
      baseFiles: listArg(argv, "--base"),
      oldFiles: listArg(argv, "--old"),
      newFiles,
    });
    writeFileSync(out, (urls ?? []).map((u) => `${u}\n`).join(""));
    if (urls !== null) {
      keep.forEach((file, i) => {
        mkdirSync(dirname(file), { recursive: true });
        copyFileSync(newFiles[i], file);
      });
    }
    console.log(`IndexNow: ${urls?.length ?? 0} changed URL(s) -> ${out}`);
  } else if (command === "submit" && argv[1]) {
    const urls = readFileSync(argv[1], "utf8").split("\n").filter(Boolean);
    const result = await submit({ urls, key: findKey() });
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `result=${result}\n`);
  } else {
    throw new Error(
      "usage: indexnow.mjs key | diff [--base …] --old … --new … [--keep …] --out f | submit f"
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`::error::indexnow: ${error.message}`);
    process.exit(1);
  });
}
