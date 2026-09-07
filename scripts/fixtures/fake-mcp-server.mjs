#!/usr/bin/env node
// A stand-in MCP stdio server for scripts/mcp-container-smoke.test.mjs, so the
// checker can be tested without building a container. `FAKE_MCP_MODE` selects
// which failure the server acts out; "ok" is a server that behaves.

const MODE = process.env.FAKE_MCP_MODE ?? "ok";

const KRD = JSON.stringify({ version: "1.0", name: "Container smoke test" });

const toolList = () => {
  const tools = [
    { name: "kaiord_convert", description: "Convert between formats" },
    { name: "kaiord_validate", description: "Validate a KRD document" },
  ];
  if (MODE === "no-tools") return [];
  if (MODE === "missing-tool") return [tools[1]];
  if (MODE === "undescribed")
    return [{ ...tools[0], description: "  " }, tools[1]];
  return tools;
};

const callResult = (name) => {
  if (name === "kaiord_convert") {
    if (MODE === "no-jvm") {
      return {
        content: [
          {
            type: "text",
            text: "Error: Zwift file does not conform to XSD schema",
          },
        ],
        isError: true,
      };
    }
    if (MODE === "bad-krd") {
      return {
        content: [{ type: "text", text: "Converted to krd. Written to: /out" }],
      };
    }
    return { content: [{ type: "text", text: KRD }] };
  }
  if (MODE === "invalid-krd") {
    return {
      content: [{ type: "text", text: "Error: schema validation failed" }],
      isError: true,
    };
  }
  return { content: [{ type: "text", text: "Valid KRD document." }] };
};

const respond = (id, result) =>
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");

const handle = (message) => {
  if (message.id === undefined) return; // notification
  if (message.method === "initialize") {
    respond(message.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: true } },
      serverInfo: {
        name: MODE === "wrong-name" ? "not-kaiord" : "kaiord-mcp",
        version: "0.0.0-test",
      },
    });
    return;
  }
  if (message.method === "tools/list") {
    respond(message.id, { tools: toolList() });
    return;
  }
  if (message.method === "tools/call") {
    respond(message.id, callResult(message.params.name));
    return;
  }
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id: message.id,
      error: { code: -32601, message: `unknown method ${message.method}` },
    }) + "\n"
  );
};

if (MODE === "stdout-noise") {
  process.stdout.write("Kaiord MCP server started\n");
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line === "") continue;
    handle(JSON.parse(line));
  }
});
process.stdin.on("end", () => process.exit(0));
