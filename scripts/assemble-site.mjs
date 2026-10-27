#!/usr/bin/env node
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

import { emitLegacyEditorPage } from "./emit-legacy-editor-page.mjs";
import { injectSpaFallback } from "./inject-spa-fallback.mjs";

// The one place that turns the three site builds into the tree Pages serves.
// The deploy, CI and the e2e fixture all call it, so a guard run against its
// output is checking the same shape that ships.
//
// The copy mirrors `cp -r <dist>/* <dest>/`: the shell glob skips top-level
// dotfiles. Each `public/` carries a `.nojekyll`, and only the landing's is
// meant to reach the site root, so it is the only one copied by name.

export const UMAMI_PLACEHOLDER = "__UMAMI_WEBSITE_ID__";

const copyGlobContents = (from, to) => {
  if (!existsSync(from)) throw new Error(`Build output missing: ${from}`);
  const entries = readdirSync(from).filter((entry) => !entry.startsWith("."));
  // An unmatched glob is literal in sh, so `cp -r empty/*` fails too.
  if (entries.length === 0) throw new Error(`Build output empty: ${from}`);
  mkdirSync(to, { recursive: true });
  for (const entry of entries) {
    cpSync(join(from, entry), join(to, entry), { recursive: true });
  }
};

// The SPA shell carries the id as runtime config and the landing 404 is a
// public/ file Vite never rewrites; every other page bakes it in at build.
const substituteAnalyticsId = (out, websiteId) => {
  if (!websiteId) return false;
  for (const file of [join(out, "app/index.html"), join(out, "404.html")]) {
    if (!existsSync(file)) throw new Error(`Build artifact missing: ${file}`);
    const html = readFileSync(file, "utf8").replaceAll(
      UMAMI_PLACEHOLDER,
      websiteId
    );
    if (html.includes(UMAMI_PLACEHOLDER)) {
      throw new Error(
        `Placeholder ${UMAMI_PLACEHOLDER} still present in ${file}`
      );
    }
    writeFileSync(file, html);
  }
  return true;
};

export function assembleSite({ out, landing, app, docs, sha, umamiWebsiteId }) {
  if (!sha) throw new Error("assembleSite: a build sha is required");
  copyGlobContents(landing, out);
  const landingNojekyll = join(landing, ".nojekyll");
  if (existsSync(landingNojekyll)) {
    copyFileSync(landingNojekyll, join(out, ".nojekyll"));
  }
  copyGlobContents(app, join(out, "app"));
  writeFileSync(join(out, "app/version.json"), `{"sha":"${sha}"}\n`);
  if (docs !== null) copyGlobContents(docs, join(out, "docs"));
  const analytics = substituteAnalyticsId(out, umamiWebsiteId);
  injectSpaFallback(out);
  emitLegacyEditorPage(out);
  return { analytics };
}

export function parseAssembleArgs(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      out: { type: "string" },
      landing: { type: "string" },
      app: { type: "string" },
      docs: { type: "string" },
      without: { type: "string", multiple: true, default: [] },
      sha: { type: "string" },
    },
  });
  const withoutDocs = values.without.includes("docs");
  if (withoutDocs === Boolean(values.docs)) {
    throw new Error("Pass exactly one of --docs <dir> or --without docs");
  }
  for (const name of ["out", "landing", "app", "sha"]) {
    if (!values[name]) throw new Error(`Missing --${name}`);
  }
  return {
    out: resolve(values.out),
    landing: resolve(values.landing),
    app: resolve(values.app),
    docs: withoutDocs ? null : resolve(values.docs),
    sha: values.sha,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseAssembleArgs(process.argv.slice(2));
  const { analytics } = assembleSite({
    ...options,
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID,
  });
  console.log(
    analytics
      ? "Analytics website id injected"
      : "UMAMI_WEBSITE_ID unset; leaving placeholders (analytics disabled)"
  );
  console.log(`✅ Site assembled in ${options.out}`);
}
