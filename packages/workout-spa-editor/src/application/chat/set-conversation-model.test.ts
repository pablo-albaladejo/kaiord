import { beforeEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import {
  clearConversationModel,
  setConversationModel,
} from "./set-conversation-model";

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

  it("should reject a blank model id and leave the row untouched", async () => {
    // Arrange

    // Act
    const write = setConversationModel(port, "p1", "c1", "prov-2", "  ", LATER);

    // Assert
    await expect(write).rejects.toThrow();
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.modelId).toBeUndefined();
  });

  it("should clear the model override and advance updatedAt", async () => {
    // Arrange
    await setConversationModel(port, "p1", "c1", "prov-2", "gpt-4o", NOW);

    // Act
    await clearConversationModel(port, "p1", "c1", LATER);

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.providerId).toBeUndefined();
    expect(row?.modelId).toBeUndefined();
    expect(row?.title).toBe("T");
    expect(row?.updatedAt).toBe("2026-06-19T13:00:00.000Z");
  });
});
