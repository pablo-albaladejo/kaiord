# MCP Chat Agent on AWS Lambda

Architecture guide for building a conversational AI agent backed by the Kaiord MCP server, running on AWS Lambda with Vercel AI SDK.

## Architecture

```
┌──────────────┐    POST /chat     ┌──────────────────────────────────┐
│              │ ← { messages[] } →│  AWS Lambda                      │
│   Frontend   │                   │  ┌──────────┐  ┌──────────────┐  │
│   (useChat)  │ ← stream/text →  │  │  AI SDK  │──│  MCP Server  │  │
│              │                   │  │  Claude   │  │  (in-memory) │  │
└──────────────┘                   │  └──────────┘  └──────────────┘  │
                                   └──────────────────────────────────┘
```

- **Frontend** holds the `messages[]` array and sends it on every request
- **Lambda** is stateless: creates the MCP server in memory, generates the response, and terminates
- **No subprocess, no network**: `InMemoryTransport` connects client and server in the same process

## Dependencies

```json
{
  "dependencies": {
    "@kaiord/mcp": "^4.4.0",
    "@modelcontextprotocol/sdk": "^1.26.0",
    "@ai-sdk/mcp": "^0.6.0",
    "@ai-sdk/anthropic": "^1.2.0",
    "ai": "^4.3.0"
  }
}
```

## Lambda Handler

Uses [Lambda response streaming](https://docs.aws.amazon.com/lambda/latest/dg/configuration-response-streaming.html) via `awslambda.streamifyResponse` for real-time token delivery.

```typescript
// handler.ts
import { createServer } from "@kaiord/mcp";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const SYSTEM_PROMPT = `You are a fitness data assistant powered by Kaiord.

Before creating or editing KRD documents, call kaiord_get_format_spec to get the specification.
Use kaiord_list_formats to discover supported formats (FIT, TCX, ZWO, GCN, KRD).

You can:
- Convert workout files between formats
- Validate KRD documents against the schema
- Inspect fitness files and summarize their contents
- Extract structured workouts from any supported format
- Compare two fitness files and show differences`;

const createMcpClient = async () => {
  const server = createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const mcpClient = await experimental_createMCPClient({
    transport: clientTransport,
  });

  return { mcpClient, server };
};

export const handler = awslambda.streamifyResponse(
  async (event, responseStream) => {
    const { messages } = JSON.parse(event.body);
    const { mcpClient, server } = await createMcpClient();

    try {
      const result = streamText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: SYSTEM_PROMPT,
        tools: await mcpClient.tools(),
        maxSteps: 10,
        messages,
      });

      const reader = result.toDataStream().getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseStream.write(value);
      }
    } finally {
      responseStream.end();
      await mcpClient.close();
      await server.close();
    }
  }
);
```

### Non-streaming variant

If response streaming is not available (e.g., behind API Gateway REST), use `generateText` instead:

```typescript
import { generateText } from "ai";

export const handler = async (event) => {
  const { messages } = JSON.parse(event.body);
  const { mcpClient, server } = await createMcpClient();

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-5-20250929"),
      system: SYSTEM_PROMPT,
      tools: await mcpClient.tools(),
      maxSteps: 10,
      messages,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "assistant", content: text }),
    };
  } finally {
    await mcpClient.close();
    await server.close();
  }
};
```

## Frontend

Uses `useChat` from Vercel AI SDK for automatic message state management, streaming display, and input handling.

```tsx
// chat.tsx
import { useChat } from "@ai-sdk/react";

export const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: process.env.NEXT_PUBLIC_CHAT_API_URL,
    });

  return (
    <div>
      <div>
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role === "user" ? "You" : "Kaiord"}:</strong>
            <p>{m.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about your workout files..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
};
```

### What `useChat` handles automatically

- Maintains the `messages[]` array across turns
- Sends the full conversation history on each request
- Displays streamed tokens in real time
- Manages loading/error states

## AWS Infrastructure

### Lambda Function URL (recommended for streaming)

```yaml
# template.yaml (SAM)
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Resources:
  ChatFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: handler.handler
      Runtime: nodejs20.x
      Timeout: 120
      MemorySize: 512
      Environment:
        Variables:
          ANTHROPIC_API_KEY: !Ref AnthropicApiKey
      FunctionUrlConfig:
        AuthType: NONE # Add auth for production
        InvokeMode: RESPONSE_STREAM
        Cors:
          AllowOrigins: ["*"]
          AllowMethods: ["POST"]
          AllowHeaders: ["Content-Type"]

Parameters:
  AnthropicApiKey:
    Type: String
    NoEcho: true
```

### Key configuration

| Setting     | Value             | Reason                                    |
| ----------- | ----------------- | ----------------------------------------- |
| Timeout     | 120s              | Claude tool loops can take multiple steps |
| Memory      | 512 MB            | MCP server + AI SDK in same process       |
| Runtime     | Node.js 20.x      | ESM support required                      |
| Invoke mode | `RESPONSE_STREAM` | Real-time token streaming                 |

## Adding Conversation Persistence

For multi-session or multi-device support, add DynamoDB:

```typescript
// With session persistence
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const loadMessages = async (sessionId: string) => {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: "chat-sessions", Key: { sessionId } })
  );
  return Item?.messages ?? [];
};

const saveMessages = async (sessionId: string, messages: unknown[]) => {
  await ddb.send(
    new PutCommand({
      TableName: "chat-sessions",
      Item: { sessionId, messages, ttl: Math.floor(Date.now() / 1000) + 86400 },
    })
  );
};
```

## Available MCP Tools

The agent has access to these tools via `@kaiord/mcp`:

| Tool                     | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `kaiord_get_format_spec` | Get the KRD format specification                 |
| `kaiord_list_formats`    | List supported formats (FIT, TCX, ZWO, GCN, KRD) |
| `kaiord_convert`         | Convert between fitness data formats             |
| `kaiord_validate`        | Validate a KRD document against the schema       |
| `kaiord_inspect`         | Inspect a fitness file and return a summary      |
| `kaiord_extract_workout` | Extract structured workout as JSON               |
| `kaiord_diff`            | Compare two fitness files                        |

## Example Conversations

**User:** "List all supported formats"

- Agent calls `kaiord_list_formats` and presents the results

**User:** "Validate this KRD" + pastes JSON

- Agent calls `kaiord_validate` with `input_content`

**User:** "Create a 30-minute interval workout for cycling"

- Agent calls `kaiord_get_format_spec` to learn the KRD structure
- Agent builds the KRD JSON following the spec
- Agent calls `kaiord_validate` to verify the document
- Agent returns the validated workout
