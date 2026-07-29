// Tests for packages/docs/scripts/check-privacy-policy.mjs

import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  checkManifestPermissions,
  checkPolicy,
  checkSidebar,
  sectionBody,
} from "./check-privacy-policy.mjs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Delete a whole `## <heading>` section (heading line included) up to the
// next top-level heading. This is the mutation every section-anchored rule
// must detect: before anchoring, deleting an extension's entire section
// left the lint green because the intro sentence and the Communication
// Scope bullets still mentioned the extension and its host.
function dropSection(src, heading) {
  const lines = src.split("\n");
  const start = lines.findIndex((line) => line.trimEnd() === `## ${heading}`);
  if (start === -1) throw new Error(`fixture has no "## ${heading}" section`);
  const after = lines.slice(start + 1).findIndex((line) => /^## /.test(line));
  const end = after === -1 ? lines.length : start + 1 + after;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n");
}

const FULL = `
---
title: Privacy Policy
---

# Privacy Policy

**Last updated:** 2026-04-17

This policy covers the Kaiord Garmin Bridge, the Kaiord Train2Go Bridge, the Kaiord Tanita Bridge, the Kaiord TrainingPeaks Bridge, and the Kaiord WHOOP Bridge Chrome extensions.

## Data Controller

For GDPR purposes there is no Kaiord-operated data controller.

## Data Collection

All state is stored in your browser via IndexedDB. You can clear site data
in your browser to remove everything at once.

If you configure AI features, prompts are sent directly to the
provider (Anthropic, OpenAI, or Google).

When you use the in-app chat assistant, summaries of your workout,
coaching, and health data are sent to the provider only while you
converse. Your chat transcripts are stored locally and, with sync on,
in your own cloud snapshot — never on a Kaiord server.

## Kaiord Garmin Bridge Extension

- **OAuth Token**: minted from your Garmin session and stored in \`chrome.storage.local\`.
- Host: https://connect.garmin.com/*
- Kaiord origin: https://*.kaiord.com/*

## Kaiord Train2Go Bridge Extension

- Host: https://app.train2go.com/*

## Kaiord Tanita Bridge Extension

- Host: https://mytanita.eu/*
- Reads your body-composition CSV export with no password.

## Kaiord TrainingPeaks Bridge Extension

- Host: https://tpapi.trainingpeaks.com/*
- No password: it exchanges your session cookie for a short-lived access token.

## Kaiord WHOOP Bridge Extension

- No OAuth, no developer API key: captures the session bearer from your existing app.whoop.com session.
- Capture path 1: a main-world script reads the \`Authorization: bearer\` header the WHOOP app attaches to its own requests.
- Capture path 2: the service worker reads that header via \`chrome.webRequest.onBeforeSendHeaders\`, read-only.
- Capture path 3: the content script reads the access token stored in \`localStorage\` under a \`CognitoIdentityServiceProvider.<client-id>.accessToken\` key.
- Permissions: \`tabs\`, \`webRequest\`, \`scripting\`, \`storage\`. It does **not** declare the \`cookies\` permission.
- It decodes the bearer's \`custom:user_id\` claim and returns that account id to the editor.
- Host: https://app.whoop.com/*

## Communication Scope

The extensions contact https://connect.garmin.com/*,
https://app.train2go.com/*, https://mytanita.eu/*,
https://tpapi.trainingpeaks.com/* and https://app.whoop.com/* only.
\`externally_connectable\` is a one-way inbound channel.
An announce-only content script injects into SPA origins so the
editor can discover installed extensions at runtime.
Local dev origins: http://localhost:5173 and http://localhost:5174.
Each extension declares \`host_permissions\` limited to the single
host listed above — no wildcard or \`<all_urls>\` access.

## Regulatory Compliance

Under GDPR and CCPA you retain access, rectification, erasure, portability.

## Children's Privacy

Not directed at children under 13.

## Changes to this Policy

Material changes are announced through the project's GitHub release notes.

## Open Source

https://github.com/pablo-albaladejo/kaiord

## Contact

Please contact the project maintainer, Pablo Albaladejo.
`;

test("complete policy passes", () => {
  assert.deepEqual(checkPolicy(FULL), []);
});

test("missing Last updated is flagged", () => {
  const src = FULL.replace(/\*\*Last updated:\*\*\s+\d{4}-\d{2}-\d{2}/, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Last updated")));
});

test("missing Train2Go Bridge coverage is flagged", () => {
  const src = FULL.replace(/Kaiord Train2Go Bridge/g, "Removed Bridge");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Train2Go Bridge extension covered")));
});

// ---------- section anchoring (one negative case per bridge) ----------
//
// Each case deletes ONE extension's entire section while leaving the intro
// sentence and the Communication Scope host list intact. Every rule about
// that extension must fail. Before the rules were anchored to
// `^## Kaiord <Name> Bridge Extension$`, this mutation was invisible.

const SECTION_CASES = [
  {
    bridge: "Garmin",
    heading: "Kaiord Garmin Bridge Extension",
    alsoBroken: ["Garmin host disclosed", "OAuth-token local-storage"],
  },
  {
    bridge: "Train2Go",
    heading: "Kaiord Train2Go Bridge Extension",
    alsoBroken: ["Train2Go host disclosed"],
  },
  {
    bridge: "Tanita",
    heading: "Kaiord Tanita Bridge Extension",
    alsoBroken: [
      "Tanita host disclosed",
      "Tanita body-composition read scope",
      "Tanita no-password",
    ],
  },
  {
    bridge: "TrainingPeaks",
    heading: "Kaiord TrainingPeaks Bridge Extension",
    alsoBroken: [
      "TrainingPeaks host disclosed",
      "TrainingPeaks no-password cookie",
    ],
  },
  {
    bridge: "WHOOP",
    heading: "Kaiord WHOOP Bridge Extension",
    alsoBroken: [
      "WHOOP host disclosed",
      "WHOOP no-OAuth",
      "WHOOP capture path 1",
      "WHOOP capture path 2",
      "WHOOP capture path 3",
      "WHOOP declared permissions",
      "WHOOP non-declaration of the `cookies` permission",
      "WHOOP account identifier egress",
    ],
  },
];

for (const { bridge, heading, alsoBroken } of SECTION_CASES) {
  test(`deleting the ${bridge} section is flagged even though the intro still names it`, () => {
    const src = dropSection(FULL, heading);
    assert.match(src, new RegExp(`Kaiord ${bridge} Bridge`));
    const v = checkPolicy(src);
    assert.ok(
      v.some(
        (r) =>
          r.includes(`${bridge} Bridge extension covered`) &&
          r.includes("is missing entirely")
      ),
      `expected a "section missing" violation for ${bridge}, got: ${v.join(" | ")}`
    );
    for (const label of alsoBroken) {
      assert.ok(
        v.some((r) => r.includes(label)),
        `expected "${label}" to be flagged when the ${bridge} section is deleted, got: ${v.join(" | ")}`
      );
    }
  });

  test(`emptying the ${bridge} section body is flagged`, () => {
    const src = dropSection(FULL, heading).replace(
      /^## Communication Scope$/m,
      `## ${heading}\n\n## Communication Scope`
    );
    const v = checkPolicy(src);
    assert.ok(
      v.some(
        (r) =>
          r.includes(`${bridge} Bridge extension covered`) &&
          r.includes(`not found inside "## ${heading}"`)
      ),
      `expected an empty-section violation for ${bridge}, got: ${v.join(" | ")}`
    );
  });
}

// ---------- WHOOP capture-path completeness (one negative per path) ----------

test("removing the WHOOP main-world capture path is flagged", () => {
  const src = FULL.replace(/a main-world script reads the .*$/m, "redacted.");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("WHOOP capture path 1")));
});

test("removing the WHOOP webRequest capture path is flagged", () => {
  const src = FULL.replace(/chrome\.webRequest\.onBeforeSendHeaders/g, "magic");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("WHOOP capture path 2")));
});

test("removing the WHOOP localStorage capture path is flagged", () => {
  const src = FULL.replace(/CognitoIdentityServiceProvider/g, "SomeOtherStore");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("WHOOP capture path 3")));
});

test("removing the WHOOP permission enumeration is flagged", () => {
  const src = FULL.replace(/- Permissions: .*$/m, "- Permissions: a few.");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("WHOOP declared permissions")));
  assert.ok(
    v.some((r) => r.includes("WHOOP non-declaration of the `cookies`"))
  );
});

test("removing the WHOOP account-id egress disclosure is flagged", () => {
  const src = FULL.replace(/custom:user_id/g, "some-claim");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("WHOOP account identifier egress")));
});

// ---------- section scoping is real, not incidental ----------

test("a host named only in Communication Scope does not satisfy its section rule", () => {
  // The Tanita section loses its host line; Communication Scope keeps
  // mytanita.eu. An unanchored /mytanita\.eu/ rule would still pass.
  const src = FULL.replace("- Host: https://mytanita.eu/*", "- Host: redacted");
  assert.match(src, /mytanita\.eu/);
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Tanita host disclosed")));
});

test("sectionBody returns null for an absent heading and stops at the next heading", () => {
  assert.equal(sectionBody(FULL, "Kaiord Nonexistent Bridge Extension"), null);
  const body = sectionBody(FULL, "Kaiord Train2Go Bridge Extension");
  assert.match(body, /app\.train2go\.com/);
  assert.doesNotMatch(body, /mytanita\.eu/);
});

test("missing GDPR/CCPA reference is flagged", () => {
  const src = FULL.replace(/GDPR/g, "rights").replace(/CCPA/g, "rights");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("GDPR")));
  assert.ok(v.some((r) => r.includes("CCPA")));
});

test("missing LLM provider disclosure is flagged", () => {
  const src = FULL.replace(/\(Anthropic, OpenAI, or Google\)/, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("LLM provider data flow")));
});

test("missing chat assistant data-flow disclosure is flagged", () => {
  const src = FULL.replace(/in-app chat assistant/g, "some-feature");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Chat assistant data flow")));
});

test("missing chat transcript storage disclosure is flagged", () => {
  const src = FULL.replace(/chat transcripts/g, "some-records");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Chat transcripts")));
});

test("missing IndexedDB clarifier is flagged", () => {
  const src = FULL.replace(/IndexedDB/g, "some-database");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("IndexedDB")));
});

test("missing localhost dev disclosure is flagged", () => {
  const src = FULL.replace(/localhost:5173/g, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Localhost")));
});

test("missing announce-only content-script disclosure is flagged", () => {
  const src = FULL.replace(/announce-only/gi, "different-wording");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("Announce-only")));
});

test("manifest with announce-only content script match on kaiord.com passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-announce-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify(
        {
          permissions: ["tabs"],
          host_permissions: ["https://app.train2go.com/*"],
          content_scripts: [
            {
              matches: ["https://app.train2go.com/*"],
              js: ["content.js"],
            },
            {
              matches: ["https://*.kaiord.com/*", "http://localhost/*"],
              js: ["kaiord-announce.js"],
            },
          ],
        },
        null,
        2
      )
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest with undisclosed content_scripts match is still rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-undisclosed-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify(
        {
          permissions: ["tabs"],
          host_permissions: ["https://app.train2go.com/*"],
          content_scripts: [
            { matches: ["https://evil.example.com/*"], js: ["x.js"] },
          ],
        },
        null,
        2
      )
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(v.some((r) => r.includes("undisclosed content_scripts match")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- checkManifestPermissions ----------

function writeManifest(dir, permissions, host_permissions) {
  const path = join(dir, "manifest.json");
  writeFileSync(
    path,
    JSON.stringify({ permissions, host_permissions }, null, 2)
  );
  return path;
}

test("manifest without cookies and with allowed host passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-ok-"));
  try {
    const m = writeManifest(dir, ["tabs"], ["https://app.train2go.com/*"]);
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest declaring `cookies` permission is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-cookies-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "cookies"],
      ["https://app.train2go.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`cookies` is rejected even for whoop-bridge, whose only exemption is webRequest", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-whoop-cookies-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "webRequest", "cookies"],
      ["https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://app.whoop.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
    assert.ok(!v.some((r) => r.includes('permission "webRequest"')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// `webRequest` + `extraHeaders` reads Authorization headers — the same
// class of credential access the `cookies` ban exists to prevent. It is
// permitted only where an explicit, written exemption exists.

test("`webRequest` without a documented exemption is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-webrequest-"));
  try {
    const m = writeManifest(
      dir,
      ["storage", "webRequest"],
      ["https://app.train2go.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some(
        (r) =>
          r.includes('credential-access permission "webRequest"') &&
          r.includes("no documented exemption")
      )
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`webRequest` on whoop-bridge passes via its documented exemption", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-whoop-ok-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs", "webRequest", "scripting", "storage"],
      ["https://api.prod.whoop.com/*", "https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://api.prod.whoop.com/*", "https://app.whoop.com/*"])
    );
    assert.deepEqual(v, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("`webRequestBlocking` stays unconditionally forbidden, exemption or not", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-blocking-"));
  try {
    const m = writeManifest(
      dir,
      ["webRequest", "webRequestBlocking"],
      ["https://app.whoop.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "whoop-bridge",
      new Set(["https://app.whoop.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('forbidden permission "webRequestBlocking"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("optional_permissions are checked for credential access too", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-optional-"));
  try {
    const path = join(dir, "manifest.json");
    writeFileSync(
      path,
      JSON.stringify({
        permissions: ["storage"],
        optional_permissions: ["cookies"],
        host_permissions: ["https://app.train2go.com/*"],
      })
    );
    const v = checkManifestPermissions(
      path,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(
      v.some((r) => r.includes('credential-access permission "cookies"'))
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("manifest with undisclosed host_permission is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "kaiord-priv-host-"));
  try {
    const m = writeManifest(
      dir,
      ["tabs"],
      ["https://app.train2go.com/*", "https://evil.example.com/*"]
    );
    const v = checkManifestPermissions(
      m,
      "train2go-bridge",
      new Set(["https://app.train2go.com/*"])
    );
    assert.ok(v.some((r) => r.includes("undisclosed host_permission")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- checkSidebar ----------

test("sidebar config referencing privacy-policy passes", () => {
  const config = `sidebar: [{ text: 'Legal', items: [{ link: '/legal/privacy-policy' }] }]`;
  assert.deepEqual(checkSidebar(config), []);
});

test("sidebar config missing privacy-policy is flagged", () => {
  const config = `sidebar: [{ text: 'Guide', items: [] }]`;
  const v = checkSidebar(config);
  assert.equal(v.length, 1);
  assert.match(v[0], /no sidebar link/);
});
