// Render probe for every story in a built Storybook.
//
// Story files are not type-checked in this repo, so a wrong prop name produces
// no error anywhere: the component renders empty and the build log stays green.
// The only way to know a story works is to render it and look. This serves the
// static build over HTTP — a file:// origin reports an empty root for stories
// that actually work, which turns the whole probe into a false negative.
//
// Usage: node .design-sync/probe-stories.mjs <storybook-static-dir> [--json out.json]

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// `@playwright/test`, not `playwright`: only the former is a dependency here,
// and it re-exports the same browser launchers. This script sits at the repo
// root while the dependency belongs to the SPA package, and pnpm does not hoist
// it — so resolve from the package rather than from this file's own directory.
// It is CommonJS, so require() it: importing the resolved file URL hands back a
// module whose named exports are not picked up, and `chromium` reads undefined.
const require = createRequire(
  join(REPO_ROOT, "packages/workout-spa-editor/package.json")
);
const { chromium } = require("@playwright/test");

const STATIC_DIR = process.argv[2];
const jsonFlag = process.argv.indexOf("--json");
const JSON_OUT = jsonFlag > -1 ? process.argv[jsonFlag + 1] : null;

if (!STATIC_DIR) {
  console.error("usage: probe-stories.mjs <storybook-static-dir> [--json out]");
  process.exit(2);
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".map": "application/json",
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  const file = join(STATIC_DIR, normalize(path === "/" ? "/index.html" : path));
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const index = JSON.parse(
  await readFile(join(STATIC_DIR, "index.json"), "utf8")
);
const stories = Object.values(index.entries).filter((e) => e.type === "story");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

console.log(`probing ${stories.length} stories over ${base}`);

const results = [];
for (const [i, story] of stories.entries()) {
  // Without this the run prints nothing for ~15 minutes and is indistinguishable
  // from a hang. Progress goes to stderr so `--json` consumers stay clean.
  if (i % 25 === 0) process.stderr.write(`  ${i}/${stories.length}…\n`);
  const errors = [];
  const onError = (e) => errors.push(String(e.message ?? e));
  // A 404 on the favicon fires on every page and says nothing about the story.
  const onConsole = (m) =>
    m.type() === "error" &&
    !m.text().includes("Failed to load resource") &&
    errors.push(m.text());
  page.on("pageerror", onError);
  page.on("console", onConsole);

  let verdict = "ok";
  let detail = "";
  try {
    await page.goto(
      `${base}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`,
      {
        waitUntil: "networkidle",
        timeout: 20000,
      }
    );
    // Storybook renders an error panel into the root rather than throwing, so
    // "has children" alone is not enough — check for its marker too.
    const probe = await page.evaluate(() => {
      const root = document.querySelector("#storybook-root");
      if (!root) return { children: 0, text: 0, portal: 0, sbError: false };
      // A Radix dialog renders through a portal attached to <body>, so its
      // content is NOT under #storybook-root. Counting only the root marks
      // every working dialog as empty — count what the portal added too.
      const portal = [...document.body.children]
        .filter(
          (el) => el.id !== "storybook-root" && el.id !== "storybook-docs"
        )
        .reduce((n, el) => n + (el.innerText ?? "").trim().length, 0);
      return {
        children: root.children.length,
        text: (root.innerText ?? "").trim().length,
        portal,
        // `#error-message` is always in iframe.html, hidden. Presence proves
        // nothing — the class on <body> is what Storybook toggles to show it.
        sbError: document.body.classList.contains("sb-show-errordisplay"),
      };
    });
    if (probe.sbError) {
      verdict = "sb-error";
    } else if (probe.children === 0 && probe.text === 0 && probe.portal === 0) {
      verdict = "empty";
    } else if (errors.length) {
      // A story can paint and still be broken — a throwing effect, a failed
      // play function. Reporting that while exiting 0 makes the probe look
      // like it passed.
      verdict = "threw";
    }
    detail = `children=${probe.children} text=${probe.text} portal=${probe.portal}`;
  } catch (e) {
    verdict = "load-failed";
    detail = String(e.message ?? e).split("\n")[0];
  }

  page.off("pageerror", onError);
  page.off("console", onConsole);
  results.push({
    id: story.id,
    title: story.title,
    name: story.name,
    verdict,
    detail,
    errors,
  });
}

await browser.close();
server.close();

const byVerdict = results.reduce(
  (a, r) => ((a[r.verdict] = (a[r.verdict] ?? 0) + 1), a),
  {}
);
console.log(`\n${results.length} stories probed:`, byVerdict);

const bad = results.filter((r) => r.verdict !== "ok");
if (bad.length) {
  console.log("\nNOT OK:");
  for (const r of bad) {
    console.log(`  [${r.verdict}] ${r.id}  (${r.detail})`);
    if (r.errors.length) console.log(`      ${r.errors[0].slice(0, 160)}`);
  }
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(results, null, 2));
// Exit non-zero on any bad story, so this can gate rather than just narrate.
process.exit(bad.length ? 1 : 0);
