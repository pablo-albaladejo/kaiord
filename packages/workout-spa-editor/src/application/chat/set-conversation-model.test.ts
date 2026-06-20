import { beforeEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { setConversationModel } from "./set-conversation-model";

const NOW = () => new Date("2026-06-19T12:00:00.000Z");
const LATER = () => new Date("2026-06-19T13:00:00.000Z");

describe("setConversationModel", () => {
  let port: PersistencePort;

  beforeEach(async () => {
    port = createInMemoryPersistence();
    await port.chatConversations.put({
      id: "c1",
      profileId: "p1",
      title: "T",
      createdAt: "2026-06-19T12:00:00.000Z",
      updatedAt: "2026-06-19T12:00:00.000Z",
    });
  });

  it("should stamp the model override and advance updatedAt", async () => {
    // Arrange

    // Act
    await setConversationModel(port, "p1", "c1", "prov-2", "gpt-4o", LATER);

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.providerId).toBe("prov-2");
    expect(row?.modelId).toBe("gpt-4o");
    expect(row?.updatedAt).toBe("2026-06-19T13:00:00.000Z");
  });

  it("should be a no-op for an absent conversation", async () => {
    // Arrange

    // Act
    await setConversationModel(port, "p1", "missing", "prov-2", "gpt-4o", NOW);

    // Assert
    expect(await port.chatConversations.get("p1", "missing")).toBeUndefined();
  });
});
