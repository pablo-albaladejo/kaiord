// The content security policy of the landing and the Kaiord App, one list of
// sources per directive. Every remote origin is one the code already talks to:
//
//   Umami      landing + App   cloud.umami.is/script.js, which posts to
//                              gateway.umami.is/api/send (its default host)
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
// a style cannot run code. frame-ancestors, report-uri and sandbox are not
// listed because a <meta> policy ignores them.

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

export const SITE_CSP = { landing: LANDING, app: APP };

export function serializePolicy(directives, scriptHashes = []) {
  return Object.entries(directives)
    .map(([name, sources]) =>
      [name, ...sources, ...(name === "script-src" ? scriptHashes : [])].join(
        " "
      )
    )
    .join("; ");
}
