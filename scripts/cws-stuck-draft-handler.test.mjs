// Tests for scripts/cws-stuck-draft-handler.mjs using node:test.
// All gh + publish calls are injected fakes; no real network or shell access.

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { handle } from "./cws-stuck-draft-handler.mjs";

function makeGh(listResponses = ["[]"]) {
  const calls = [];
  let listIdx = 0;
  const gh = (sub, args) => {
    calls.push({ sub, args });
    if (sub === "issue" && args[0] === "list") {
      const idx = Math.min(listIdx, listResponses.length - 1);
      listIdx += 1;
      return listResponses[idx];
    }
    if (sub === "issue" && args[0] === "create") {
      return "https://github.com/o/r/issues/42\n";
    }
    return "";
  };
  return { gh, calls };
}

const issueListJson = (body) =>
  JSON.stringify([
    { number: 7, title: "cws-publish-stuck-train2go-bridge-7.2.1", body },
  ]);

const baseArgs = {
  extension: "train2go-bridge",
  extensionId: "abc123",
  version: "7.2.1",
  runUrl: "https://example.com/run/1",
};

test("Tier 1 — no issue exists -> creates issue with template body", async () => {
  const { gh, calls } = makeGh(["[]"]);
  const result = await handle({ ...baseArgs, gh, publish: async () => {} });
  assert.deepEqual(result, { tier: 1, action: "opened-issue" });
  const create = calls.find((c) => c.args[0] === "create");
  assert.ok(create, "issue create call expected");
  const bodyIdx = create.args.indexOf("--body");
  assert.match(create.args[bodyIdx + 1], /RETRY_COUNT: 0/);
  assert.match(create.args[bodyIdx + 1], /train2go-bridge draft is at 7\.2\.1/);
  const labelIdx = create.args.indexOf("--label");
  assert.equal(create.args[labelIdx + 1], "cws-stuck");
});

test("Tier 1 — issue exists but RETRY_COUNT missing -> resets counter", async () => {
  const { gh, calls } = makeGh([
    issueListJson("Human edited body, no marker.\n"),
  ]);
  const result = await handle({ ...baseArgs, gh, publish: async () => {} });
  assert.deepEqual(result, { tier: 1, action: "reset-counter" });
  const edit = calls.find((c) => c.args[0] === "edit");
  assert.ok(edit, "issue edit call expected");
  const bodyIdx = edit.args.indexOf("--body");
  assert.match(edit.args[bodyIdx + 1], /RETRY_COUNT: 0/);
  assert.equal(edit.args[1], "7");
});

test("Tier 2 — RETRY_COUNT: 0 -> bumps to 1 and calls publishItem", async () => {
  const { gh, calls } = makeGh([issueListJson("Body\nRETRY_COUNT: 0\n")]);
  const publishCalls = [];
  const publish = async (id) => {
    publishCalls.push(id);
    return { status: ["OK"] };
  };
  const result = await handle({ ...baseArgs, gh, publish });
  assert.deepEqual(result, { tier: 2, action: "publishitem-kicked" });
  assert.deepEqual(publishCalls, ["abc123"]);
  const edits = calls.filter((c) => c.args[0] === "edit");
  assert.equal(edits.length, 1);
  const bodyIdx = edits[0].args.indexOf("--body");
  assert.match(edits[0].args[bodyIdx + 1], /RETRY_COUNT: 1/);
});

test("Tier 2 — RETRY_COUNT: 1 -> bumps to 2 and calls publishItem", async () => {
  const { gh, calls } = makeGh([issueListJson("Body\nRETRY_COUNT: 1\n")]);
  const publishCalls = [];
  const publish = async (id) => {
    publishCalls.push(id);
  };
  const result = await handle({ ...baseArgs, gh, publish });
  assert.deepEqual(result, { tier: 2, action: "publishitem-kicked" });
  assert.deepEqual(publishCalls, ["abc123"]);
  const edits = calls.filter((c) => c.args[0] === "edit");
  const bodyIdx = edits[0].args.indexOf("--body");
  assert.match(edits[0].args[bodyIdx + 1], /RETRY_COUNT: 2/);
});

test("Tier 2 — publishItem 429 -> sentinel RETRY_COUNT: -1 applied", async () => {
  const { gh, calls } = makeGh([issueListJson("Body\nRETRY_COUNT: 0\n")]);
  const publish = async () => {
    throw new Error("[CwsStateError] publishItem returned 429 (rate limited)");
  };
  const result = await handle({ ...baseArgs, gh, publish });
  assert.deepEqual(result, {
    tier: "2-failed-to-3",
    action: "sentinel-applied",
  });
  const edits = calls.filter((c) => c.args[0] === "edit");
  assert.equal(edits.length, 2, "expect two edits: bump then sentinel");
  const lastBodyIdx = edits[1].args.indexOf("--body");
  assert.match(edits[1].args[lastBodyIdx + 1], /RETRY_COUNT: -1/);
});

test("Tier 3 — RETRY_COUNT: 3 -> escalation-required, no publishItem call", async () => {
  const { gh } = makeGh([issueListJson("Body\nRETRY_COUNT: 3\n")]);
  let publishCalled = false;
  const publish = async () => {
    publishCalled = true;
  };
  const result = await handle({ ...baseArgs, gh, publish });
  assert.deepEqual(result, { tier: 3, action: "escalation-required" });
  assert.equal(publishCalled, false);
});

test("Tier 3 — sentinel RETRY_COUNT: -1 -> escalation-required, no publishItem call", async () => {
  const { gh } = makeGh([issueListJson("Body\nRETRY_COUNT: -1\n")]);
  let publishCalled = false;
  const publish = async () => {
    publishCalled = true;
  };
  const result = await handle({ ...baseArgs, gh, publish });
  assert.deepEqual(result, { tier: 3, action: "escalation-required" });
  assert.equal(publishCalled, false);
});
