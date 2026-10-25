import { strict as assert } from "node:assert";
import { test } from "node:test";

import { headManifestHrefs } from "./manifest-link.mjs";

const page = (head, body = "") =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

test("headManifestHrefs finds the manifest link in head", () => {
  const html = page('<link rel="manifest" href="/app/manifest.webmanifest" />');

  assert.deepEqual(headManifestHrefs(html), ["/app/manifest.webmanifest"]);
});

test("headManifestHrefs ignores a commented-out manifest link", () => {
  const html = page(
    '<!-- <link rel="manifest" href="/manifest.webmanifest"> -->'
  );

  assert.deepEqual(headManifestHrefs(html), []);
});

test("headManifestHrefs ignores a manifest link outside head", () => {
  const html = page("", '<link rel="manifest" href="/manifest.webmanifest" />');

  assert.deepEqual(headManifestHrefs(html), []);
});
