// The content security policy of every page of the site (the landing, the
// docs and the Kaiord App), one list of sources per directive. Every remote
// origin is one the code already talks to:
//
//   Umami      every page      cloud.umami.is/script.js, which posts to
//                              gateway.umami.is/api/send (its default host);
//                              the docs load it from .vitepress/head-config
//   Providers  App             @kaiord/ai createLanguageModel: the athlete's
//                              Anthropic, OpenAI and Google keys, called from
//                              the browser
//   Drive      App             adapters/cloud-sync: the GIS client, its token
//                              iframe and style, and the Drive REST API
//   intervals  App             adapters/connections/intervals-icu-validate
//
// Extensions answer through chrome.runtime messaging and content scripts,
// which a page policy does not govern. The MCP worker is not called by the
// App. Inline scripts are allowed by their sha256 only, computed from the
// page that ships. Styles keep 'unsafe-inline': the landing carries style
// attributes and the App's UI libraries insert <style> elements at run time;
// a style cannot run code. Only the App may start a worker, its own service
// worker, named by its exact URL (`appWorkerSource`) once the site is
// assembled for an origin; the landing, the docs and an App page with no
// origin (the dev server) may start none. frame-ancestors, report-uri and
// sandbox are not listed because a <meta> policy ignores them.

const UMAMI_SCRIPT = "https://cloud.umami.is/script.js";
const UMAMI_CONNECT = ["https://cloud.umami.is", "https://gateway.umami.is"];
const GIS = "https://accounts.google.com/gsi/";

const LANDING = {
  "default-src": ["'none'"],
  "script-src": ["'self'", UMAMI_SCRIPT],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'", ...UMAMI_CONNECT],
  "manifest-src": ["'self'"],
  // Without it a worker falls back to script-src, which admits 'self'.
  "worker-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
  "object-src": ["'none'"],
};

const APP = {
  ...LANDING,
  "script-src": [...LANDING["script-src"], `${GIS}client`],
  "style-src": [...LANDING["style-src"], `${GIS}style`],
  "connect-src": [
    ...LANDING["connect-src"],
    "https://api.anthropic.com",
    "https://api.openai.com",
    "https://generativelanguage.googleapis.com",
    "https://www.googleapis.com",
    GIS,
    "https://intervals.icu",
  ],
  "frame-src": [GIS],
};

// The docs are a VitePress build: module scripts from 'self', two inline
// scripts (theme and platform class) hashed like any other, the same Umami
// tracker as the landing, and local search, so nothing else remote.
const DOCS = LANDING;

export const SITE_CSP = { landing: LANDING, docs: DOCS, app: APP };

// The App's own service worker (spa-offline), by its exact URL: `'self'`
// would admit any same-origin script, and a host-source needs the origin (a
// path alone is not a source). A path is matched on the first request only,
// and a service worker script is never fetched across a redirect. The
// worker's own fetches are governed by its own (empty) policy, not this one:
// it fetches only same-origin files it precaches.
export const appWorkerSource = (origin) =>
  `${new URL(origin).origin}/app/sw.js`;

/** The App's policy for a site served from `origin`. */
export const appPolicyFor = (origin) => ({
  ...APP,
  "worker-src": [appWorkerSource(origin)],
});

export function serializePolicy(directives, scriptHashes = []) {
  return Object.entries(directives)
    .map(([name, sources]) =>
      [name, ...sources, ...(name === "script-src" ? scriptHashes : [])].join(
        " "
      )
    )
    .join("; ");
}
