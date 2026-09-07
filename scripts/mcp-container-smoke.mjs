#!/usr/bin/env node
// Drives a built @kaiord/mcp container the way an MCP client — and Glama's
// introspection — actually drives it: over stdio, with a real JSON-RPC
// handshake.
//
//   node scripts/mcp-container-smoke.mjs [command ...]
//
// Defaults to `docker run --rm -i kaiord-mcp:ci`. Pass another command to
// point it somewhere else:
//
//   node scripts/mcp-container-smoke.mjs node packages/mcp/dist/bin/kaiord-mcp.js
//
// `docker build` succeeding proves nothing about the server inside. Three
// failures survive a green build, and this catches all three: an entrypoint
// that dies before speaking MCP, a tool surface that came up empty or
// undescribed (Glama scores tool descriptions, so an empty one is a silent
// score of zero), and a missing JVM — @kaiord/zwo validates Zwift files
// against the XSD through a Java helper, so without it every .zwo read fails
// while every other format keeps working.

import { spawn } from "node:child_process";

const DEFAULT_COMMAND = ["docker", "run", "--rm", "-i", "kaiord-mcp:ci"];
const REQUEST_TIMEOUT_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
const SERVER_NAME = "kaiord-mcp";

// A document the Zwift XSD accepts. Reading it exercises the
// xsd-schema-validator → JVM path, which is wired into the ZWO reader.
const ZWO_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Kaiord</author>
  <name>Container smoke test</name>
  <description>Twenty minutes at endurance pace.</description>
  <sportType>bike</sportType>
  <workout>
    <SteadyState Duration="1200" Power="0.65"/>
  </workout>
</workout_file>
`;

const argv = process.argv.slice(2);
const [command, ...args] = argv.length > 0 ? argv : DEFAULT_COMMAND;

const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

const pending = new Map();
let stdoutBuffer = "";
let stderrText = "";
let transportFailure = null;

// A broken transport is terminal: every in-flight and future request would
// otherwise sit until its own timeout, turning one fault into minutes of wait.
const failTransport = (message) => {
  transportFailure ??= message;
  for (const [id, entry] of pending) {
    pending.delete(id);
    clearTimeout(entry.timer);
    entry.reject(new Error(transportFailure));
  }
};

child.on("error", (error) =>
  failTransport(`could not run \`${command}\`: ${error.message}`)
);

child.stderr.on("data", (chunk) => {
  stderrText += chunk.toString();
});

child.stdout.on("data", (chunk) => {
  stdoutBuffer += chunk.toString();
  let newline;
  while ((newline = stdoutBuffer.indexOf("\n")) >= 0) {
    const line = stdoutBuffer.slice(0, newline).trim();
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (line === "") continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      // The stdio transport reserves stdout for framed JSON-RPC. A stray log
      // line there desynchronises every client, so it fails the check rather
      // than being skipped — that is what the stderr logger exists to prevent.
      failTransport(`non-JSON line on stdout: ${line}`);
      continue;
    }
    const entry = pending.get(message.id);
    if (entry) {
      pending.delete(message.id);
      clearTimeout(entry.timer);
      entry.settle(message);
    }
  }
});

let nextId = 0;

const request = (method, params = {}) =>
  new Promise((resolve, reject) => {
    if (transportFailure !== null) {
      reject(new Error(transportFailure));
      return;
    }
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timed out waiting for ${method}`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, {
      timer,
      reject,
      settle: (message) => {
        if (message.error) {
          reject(
            new Error(`${method} failed: ${JSON.stringify(message.error)}`)
          );
          return;
        }
        resolve(message.result);
      },
    });
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"
    );
  });

const notify = (method, params = {}) =>
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");

const assert = (condition, failure) => {
  if (!condition) throw new Error(failure);
};

const textOf = (result) =>
  (result.content ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

const callTool = async (name, args) => {
  const result = await request("tools/call", { name, arguments: args });
  return { text: textOf(result), isError: result.isError === true };
};

const handshake = async () => {
  const init = await request("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "kaiord-container-smoke", version: "1.0.0" },
  });
  notify("notifications/initialized");
  assert(
    init.serverInfo?.name === SERVER_NAME,
    `expected serverInfo.name ${SERVER_NAME}, got ${JSON.stringify(init.serverInfo)}`
  );
  console.log(
    `initialize ok — ${init.serverInfo.name}@${init.serverInfo.version}, protocol ${init.protocolVersion}`
  );
};

const introspect = async () => {
  const { tools } = await request("tools/list");
  assert(tools.length > 0, "the server advertised no tools");
  const undescribed = tools.filter((tool) => !tool.description?.trim());
  assert(
    undescribed.length === 0,
    `tools with no description: ${undescribed.map((tool) => tool.name).join(", ")}`
  );
  // Assert the two capabilities the rest of this check depends on rather than
  // the whole registry, which lives in create-server.ts and legitimately grows.
  for (const name of ["kaiord_convert", "kaiord_validate"]) {
    assert(
      tools.some((tool) => tool.name === name),
      `${name} is missing from the tool list`
    );
  }
  console.log(`tools/list ok — ${tools.length} tools, all described`);
};

const convertAndValidate = async () => {
  const converted = await callTool("kaiord_convert", {
    input_content: ZWO_FIXTURE,
    input_format: "zwo",
    output_format: "krd",
  });
  assert(
    !converted.isError,
    `kaiord_convert rejected a schema-valid .zwo file — is a JVM on the image?\n${converted.text}`
  );
  let krd;
  try {
    krd = JSON.parse(converted.text);
  } catch {
    throw new Error(
      `kaiord_convert did not return KRD JSON:\n${converted.text}`
    );
  }
  console.log("kaiord_convert ok — zwo → krd, XSD validation reached the JVM");

  const validated = await callTool("kaiord_validate", {
    input_content: JSON.stringify(krd),
  });
  assert(
    !validated.isError,
    `kaiord_validate rejected the KRD that kaiord_convert just produced:\n${validated.text}`
  );
  console.log(`kaiord_validate ok — ${validated.text.trim()}`);
};

const shutdown = () =>
  new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    const forced = setTimeout(() => child.kill("SIGKILL"), SHUTDOWN_TIMEOUT_MS);
    forced.unref();
    child.once("exit", () => {
      clearTimeout(forced);
      resolve();
    });
    // An MCP stdio server exits on EOF, which also lets `docker run --rm`
    // clean up its container instead of leaving it orphaned by a signal.
    child.stdin.end();
  });

try {
  await handshake();
  await introspect();
  await convertAndValidate();
  console.log("\nMCP container smoke test passed.");
} catch (error) {
  console.error(`\nMCP container smoke test FAILED: ${error.message}`);
  if (stderrText.trim() !== "") {
    console.error(`--- server stderr ---\n${stderrText}`);
  }
  process.exitCode = 1;
} finally {
  await shutdown();
}
