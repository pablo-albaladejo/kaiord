// Tests for packages/docs/scripts/check-privacy-policy.mjs

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { checkPolicy } from "./check-privacy-policy.mjs";

const FULL = `
---
title: Privacy Policy
---

# Privacy Policy

**Last updated:** 2026-04-17

## Data Controller

Client-side only.

## Data Collection

All state is stored in your browser via IndexedDB.

If you configure AI features, prompts are sent directly to the
provider (Anthropic, OpenAI, or Google).

## Kaiord Garmin Bridge Extension

- **CSRF Token**: stored in \`chrome.storage.session\`.
- Host: https://connect.garmin.com/*
- Kaiord origin: https://*.kaiord.com/*

## Kaiord Train2Go Bridge Extension

- Host: https://app.train2go.com/*

## Communication Scope

\`externally_connectable\` is a one-way inbound channel.
Local dev origins: http://localhost:5173 and http://localhost:5174.

## Regulatory Compliance

Under GDPR and CCPA you retain access, rectification, erasure, portability.

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

test("missing GDPR/CCPA reference is flagged", () => {
  const src = FULL.replace(/GDPR and CCPA/g, "regulations");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("GDPR")));
  assert.ok(v.some((r) => r.includes("CCPA")));
});

test("missing LLM provider disclosure is flagged", () => {
  const src = FULL.replace(/\(Anthropic, OpenAI, or Google\)/, "");
  const v = checkPolicy(src);
  assert.ok(v.some((r) => r.includes("LLM provider data flow")));
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
