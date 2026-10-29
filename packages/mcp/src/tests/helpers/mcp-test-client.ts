import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../../server/create-server";
import type { CreateServerOptions } from "../../server/server-options";

export type McpToolResult = {
  readonly content: ReadonlyArray<{
    readonly type: string;
    readonly text: string;
  }>;
  readonly isError?: boolean;
};

export const REMOTE_TEST_OPTIONS: CreateServerOptions = {
  toolset: "remote",
  version: "0.0.0-test",
  formatSpec: "# Injected KRD format spec",
  krdSchema: '{"title":"Injected KRD schema"}',
};

export const createTestClient = async (
  options?: CreateServerOptions
): Promise<Client> => {
  const server = createServer(options);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
};

export const createRemoteTestClient = async (
  options?: CreateServerOptions
): Promise<Client> => createTestClient({ ...REMOTE_TEST_OPTIONS, ...options });
