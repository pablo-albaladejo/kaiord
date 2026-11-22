import { createHash } from "node:crypto";

// Reads a content security policy and the scripts back out of a served page,
// for check-site-csp.mjs. It shares no code with the injector (site-csp.mjs)
// on purpose, so a bug there cannot hide here.

export const CSP_META =
  /<meta\b[^>]*http-equiv=["']?content-security-policy["']?[^>]*>/i;
// An end tag is `</script` then an HTML space, `/` or `>`, up to its `>`.
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script(?=[\t\n\f\r />])[^>]*>/gi;
const EXECUTABLE_TYPE = /^(|text\/javascript|application\/javascript|module)$/i;

// A source that admits code nobody hashed: any inline or eval'd code, any
// scheme, any host wildcard.
export const isUnsafeScriptSource = (source) =>
  /^'unsafe-(inline|eval|hashes)'$/i.test(source) ||
  source.includes("*") ||
  /^[a-z][a-z0-9+.-]*:$/i.test(source);

export const parsePolicy = (content) =>
  new Map(
    content
      .split(";")
      .map((part) => part.trim().split(/\s+/))
      .filter(([name]) => name)
      .map(([name, ...sources]) => [name.toLowerCase(), sources])
  );

export const attr = (attrs, name) =>
  new RegExp(`\\b${name}\\s*=\\s*["']?([^"'\\s>]*)`, "i").exec(attrs)?.[1];

/** Every script the browser would run, with its offset in the page. */
export const scriptsOf = (html) =>
  [...html.matchAll(SCRIPT)]
    .map((m) => ({ at: m.index, attrs: m[1], text: m[2] }))
    .filter(({ attrs }) => EXECUTABLE_TYPE.test(attr(attrs, "type") ?? ""));

export const sha256 = (text) =>
  `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
