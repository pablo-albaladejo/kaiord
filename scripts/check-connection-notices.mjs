#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ALLOWED,
  EXCEPTION,
  FIXES,
  LOCALES,
  PATTERNS,
  SOURCE_TABLES,
} from "./connection-notices.vocab.mjs";
import { failIfAny } from "./lib/guard-failure.mjs";

// R-ConnectionNoticesSingleSource. A Connection either works and shows no
// notice, or shows one of four fixes, each worded once in English and Spanish
// by packages/_shared/bridge-core/connection-notices.js (GLOSSARY.md, "What
// the athlete reads"; docs/adr/0004). The Kaiord App reads it through
// @kaiord/i18n and every extension popup loads its vendored copy. This guard
// fails on a fifth fix, on a second wording of a fix anywhere the athlete
// reads the App or an extension, and on a popup that does not read the
// source or names its Platform or sign-in page unlike the App. Beside the
// fixes the source holds only the reasons that resolve by one of them, the
// not-checked wordings, and the one exception, NO_TAB (vocab: EXCEPTION).

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const MASTER = "packages/_shared/bridge-core/connection-notices.js";
const SPA = "packages/workout-spa-editor/src";
const BRIDGES = ["garmin", "train2go", "whoop", "tanita", "trainingpeaks"].map(
  (name) => `${name}-bridge`
);
const KAIORD_FOR = "Kaiord for {platform}";

export const loadMaster = (root = ROOT) =>
  createRequire(import.meta.url)(join(root, MASTER));

const words = (wording) =>
  Object.values(wording).flatMap((byFix) =>
    Object.values(byFix).flatMap(({ message, action }) => [message, action])
  );

const sameSet = (a, b) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

const BANNED =
  /\bbridge\b|kaiord extension|extensión de kaiord|signed out|sesión cerrada/i;

const textProblems = (where, text) => {
  const problems = [];
  if (!String(text ?? "").includes("{platform}")) {
    problems.push(`${MASTER}: ${where} does not name the Platform`);
  }
  if (/\{(?!platform\})[^}]*\}/.test(text ?? "")) {
    problems.push(
      `${MASTER}: ${where} uses a placeholder other than {platform}`
    );
  }
  const banned = BANNED.exec(text ?? "");
  if (banned) problems.push(`${MASTER}: "${banned[0]}" in "${text}"`);
  return problems;
};

// One wording per key in each locale, the same keys in every locale.
const tableProblems = (name, table, keys) => {
  if (!sameSet(Object.keys(table ?? {}), LOCALES)) {
    return [
      `${MASTER}: ${name} locales are [${Object.keys(table ?? {})}], must be [${LOCALES}]`,
    ];
  }
  return Object.entries(table).flatMap(([locale, byKey]) =>
    !sameSet(Object.keys(byKey), keys)
      ? [
          `${MASTER}: ${name} ${locale} words [${Object.keys(byKey)}], must be [${keys}]`,
        ]
      : Object.entries(byKey).flatMap(([key, text]) =>
          textProblems(`${name} ${locale}.${key}`, text)
        )
  );
};

/** Reasons, not-checked wordings, the one exception, and nothing else. */
export function besideFixesProblems(api) {
  const problems = Object.keys(api)
    .filter((k) => typeof api[k] !== "function" && !SOURCE_TABLES.includes(k))
    .map(
      (k) =>
        `${MASTER}: ${k} is neither one of the four fixes nor the one exception (${EXCEPTION})`
    );
  for (const [reason, fix] of Object.entries(api.REASONS ?? {})) {
    if (!FIXES.includes(fix)) {
      problems.push(
        `${MASTER}: reason "${reason}" resolves by "${fix}", not one of [${FIXES}]`
      );
    }
  }
  problems.push(
    ...tableProblems(
      "REASON_WORDING",
      api.REASON_WORDING,
      Object.keys(api.REASONS ?? {})
    ),
    ...tableProblems(
      "NOT_CHECKED",
      api.NOT_CHECKED,
      Object.keys(api.NOT_CHECKED?.en ?? {})
    )
  );
  const exception = api[EXCEPTION] ?? {};
  if (!sameSet(Object.keys(exception), LOCALES)) {
    problems.push(
      `${MASTER}: ${EXCEPTION} locales are [${Object.keys(exception)}], must be [${LOCALES}]`
    );
  }
  for (const [locale, words] of Object.entries(exception)) {
    if (!sameSet(Object.keys(words), ["message", "action"])) {
      problems.push(
        `${MASTER}: ${EXCEPTION} ${locale} must hold exactly one message and one action`
      );
    }
    problems.push(
      ...textProblems(`${EXCEPTION} ${locale}.message`, words.message),
      ...textProblems(`${EXCEPTION} ${locale}.action`, words.action)
    );
  }
  return problems;
}

/** The single source itself: four fixes, two locales, one wording each. */
export function masterProblems(api) {
  const problems = [];
  if (!sameSet(api.FIXES, FIXES) || api.FIXES.length !== FIXES.length) {
    problems.push(
      `${MASTER}: FIXES is [${api.FIXES}], must be exactly [${FIXES}]`
    );
  }
  const mapped = Object.values(api.FIX_FOR_STATE).filter((f) => f !== null);
  if (!sameSet(mapped, FIXES)) {
    problems.push(
      `${MASTER}: FIX_FOR_STATE maps to [${mapped}], each of [${FIXES}] exactly once`
    );
  }
  if (!sameSet(Object.keys(api.WORDING), LOCALES)) {
    problems.push(
      `${MASTER}: WORDING locales are [${Object.keys(api.WORDING)}], must be [${LOCALES}]`
    );
  }
  for (const [locale, byFix] of Object.entries(api.WORDING)) {
    if (!sameSet(Object.keys(byFix), FIXES)) {
      problems.push(
        `${MASTER}: ${locale} words [${Object.keys(byFix)}], must be [${FIXES}]`
      );
    }
    for (const [fix, wording] of Object.entries(byFix)) {
      if (!sameSet(Object.keys(wording), ["message", "action"])) {
        problems.push(
          `${MASTER}: ${locale}.${fix} must hold exactly one message and one action`
        );
      }
      const both = `${wording.message ?? ""} ${wording.action ?? ""}`;
      if (!wording.message?.includes("{platform}")) {
        problems.push(
          `${MASTER}: ${locale}.${fix} message does not name the Platform`
        );
      }
      if (
        ((fix === "install" || fix === "update") &&
          !(wording.message ?? "").includes(KAIORD_FOR)) ||
        ((fix === "install" || fix === "update") &&
          !(wording.action ?? "").includes(KAIORD_FOR))
      ) {
        problems.push(
          `${MASTER}: ${locale}.${fix} must name the extension "${KAIORD_FOR}" in its message and its action`
        );
      }
      if (/\{(?!platform\})[^}]*\}/.test(both)) {
        problems.push(
          `${MASTER}: ${locale}.${fix} uses a placeholder other than {platform}`
        );
      }
    }
  }
  for (const text of words(api.WORDING)) {
    const banned = BANNED.exec(text);
    if (banned) problems.push(`${MASTER}: "${banned[0]}" in "${text}"`);
  }
  return [...problems, ...besideFixesProblems(api)];
}

const isAllowed = (where, text) =>
  ALLOWED.some(
    (entry) =>
      entry.phrase === text &&
      (where === entry.where || where.startsWith(`${entry.where}#`))
  );

/** A second wording (or a fifth fix) in one unit of athlete text. */
export function phrasingProblems(where, text) {
  if (isAllowed(where, text)) return [];
  const hit = PATTERNS.find(({ pattern }) => pattern.test(text));
  if (!hit) return [];
  return [
    `${where}: "${text}" words ${hit.fix === "a fifth fix" ? "a fifth fix" : `the ${hit.fix} fix`} outside ${MASTER}`,
  ];
}

const leaves = (node, path = []) =>
  typeof node === "string"
    ? [{ key: path.join("."), text: node }]
    : Object.entries(node ?? {}).flatMap(([k, v]) => leaves(v, [...path, k]));

const COMMENTS = /\/\*[\s\S]*?\*\/|(^|[^:"'`\\])\/\/[^\n]*/g;
const LITERALS =
  /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;

/** Every string literal in a source file, comments stripped. */
export const literalsOf = (src) =>
  [...src.replace(COMMENTS, "$1").matchAll(LITERALS)]
    .map((m) => m[1] ?? m[2] ?? m[3] ?? "")
    .filter((text) => /[a-z]{3,}\s+[a-z]{2,}/i.test(text));

const walk = (dir, root) =>
  readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path, root) : [path];
  });

// The layers that render athlete text. Transport and use-case code holds
// internal error strings and protocol constants, which the athlete never reads.
const UI_LAYERS = /\/src\/(components|hooks|lib|contexts)\//;

const isAppSource = (path) =>
  /\.(ts|tsx)$/.test(path) &&
  UI_LAYERS.test(path) &&
  !/\.(test|stories)\.tsx?$|\/test-utils\/|\/__perf__\/|\/__regressions__\/|\.d\.ts$/.test(
    path
  );

/** [{ where, text }]: every unit of text the athlete may read, App and extensions. */
export function athleteTexts(root = ROOT) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const texts = [];
  for (const locale of LOCALES) {
    const dir = `${SPA}/i18n/locales/${locale}`;
    for (const file of readdirSync(join(root, dir))) {
      const where = `${dir}/${file}`;
      for (const { key, text } of leaves(JSON.parse(read(where)))) {
        texts.push({ where: `${where}#${key}`, text });
      }
    }
  }
  for (const path of walk(SPA, root).filter(isAppSource)) {
    for (const text of literalsOf(read(path)))
      texts.push({ where: path, text });
  }
  for (const bridge of BRIDGES) {
    const locales = `packages/${bridge}/_locales`;
    for (const locale of readdirSync(join(root, locales))) {
      const where = `${locales}/${locale}/messages.json`;
      for (const [key, { message }] of Object.entries(
        JSON.parse(read(where))
      )) {
        texts.push({ where: `${where}#${key}`, text: message });
      }
    }
    const popup = `packages/${bridge}/popup.js`;
    for (const text of literalsOf(read(popup)))
      texts.push({ where: popup, text });
  }
  return texts.map(({ where, text }) => ({
    where: where.split(root).join(""),
    text,
  }));
}

const registryName = (registry, bridge) =>
  new RegExp(
    `\\{[^{}]*?name:\\s*"([^"]+)"[^{}]*?bridgeId:\\s*"${bridge}"[^{}]*\\}`
  ).exec(registry)?.[1];

/** Each popup reads the source, names its Platform and sign-in page as the App does. */
export function popupProblems(root = ROOT) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const registry = read(`${SPA}/integrations/integration-registry-entries.ts`);
  const descriptors = read(
    `${SPA}/application/connections/extension-descriptors.ts`
  );
  return BRIDGES.flatMap((bridge) => {
    const problems = [];
    const html = read(`packages/${bridge}/popup.html`);
    const popup = read(`packages/${bridge}/popup.js`);
    const at = (src) => html.indexOf(`<script src="${src}"></script>`);
    if (
      at("connection-notices.js") < 0 ||
      at("connection-notices.js") > at("popup.js")
    ) {
      problems.push(
        `packages/${bridge}/popup.html: must load connection-notices.js before popup.js`
      );
    }
    if (!/KAIORD_CONNECTION_NOTICES\.noticeFor\(/.test(popup)) {
      problems.push(
        `packages/${bridge}/popup.js: words a Connection without KAIORD_CONNECTION_NOTICES.noticeFor`
      );
    }
    const platform = /const PLATFORM = "([^"]+)";/.exec(popup)?.[1];
    const name = registryName(registry, bridge);
    if (platform === undefined || platform !== name) {
      problems.push(
        `packages/${bridge}/popup.js: PLATFORM is ${JSON.stringify(platform)}, the App names it ${JSON.stringify(name)}`
      );
    }
    const signIn = new RegExp(
      `"${bridge}":\\s*\\{[^}]*?signInUrl:\\s*"([^"]+)"`
    ).exec(descriptors)?.[1];
    if (signIn === undefined || !popup.includes(`"${signIn}"`)) {
      problems.push(
        `packages/${bridge}/popup.js: does not open the App's sign-in page ${signIn}`
      );
    }
    return problems;
  });
}

/** An ALLOWED phrase no longer on its surface is stale and must go. */
export const staleAllowed = (texts, allowed = ALLOWED) =>
  allowed
    .filter(
      (entry) =>
        !texts.some(
          ({ where, text }) =>
            text === entry.phrase &&
            (where === entry.where || where.startsWith(`${entry.where}#`))
        )
    )
    .map(
      (entry) =>
        `${entry.where}: ALLOWED phrase "${entry.phrase}" is no longer there`
    );

export function checkConnectionNotices(root = ROOT) {
  const texts = athleteTexts(root);
  return [
    ...masterProblems(loadMaster(root)),
    ...(texts.length === 0
      ? ["no athlete text found: the guard read nothing"]
      : []),
    ...texts.flatMap(({ where, text }) => phrasingProblems(where, text)),
    ...staleAllowed(texts),
    ...popupProblems(root),
  ].map((problem) => problem.replace(`${root}/`, ""));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  failIfAny(
    "connection notice problem(s)",
    checkConnectionNotices(),
    `Word a Connection only through connectionNotice (@kaiord/i18n) or KAIORD_CONNECTION_NOTICES.noticeFor; a phrase that is not a Connection notice goes in ALLOWED of scripts/connection-notices.vocab.mjs with its reason.`
  );
  console.log(
    `✅ Four fixes, one wording each, read from ${relative(ROOT, join(ROOT, MASTER))}`
  );
}
