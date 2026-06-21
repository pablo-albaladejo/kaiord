import { beforeEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { renameConversation } from "./rename-conversation";

const NOW = () => new Date("2026-06-19T12:00:00.000Z");
const LATER = () => new Date("2026-06-19T13:00:00.000Z");

const seed = (port: PersistencePort) =>
  port.chatConversations.put({
    id: "c1",
    profileId: "p1",
    title: "Original",
    createdAt: "2026-06-19T12:00:00.000Z",
    updatedAt: "2026-06-19T12:00:00.000Z",
  });

describe("renameConversation", () => {
  let port: PersistencePort;

  beforeEach(async () => {
    port = createInMemoryPersistence();
    await seed(port);
  });

  it("should set a non-empty title and advance updatedAt", async () => {
    // Arrange

    // Act
    await renameConversation(port, "p1", "c1", "  Renamed  ", LATER);

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.title).toBe("Renamed");
    expect(row?.updatedAt).toBe("2026-06-19T13:00:00.000Z");
  });

  it("should reject an empty title and leave the prior title unchanged", async () => {
    // Arrange

    // Act
    await renameConversation(port, "p1", "c1", "   ", LATER);

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.title).toBe("Original");
    expect(row?.updatedAt).toBe("2026-06-19T12:00:00.000Z");
  });

  it("should be a no-op for a foreign profile id", async () => {
    // Arrange

    // Act
    await renameConversation(port, "other", "c1", "Hacked", NOW);

    // Assert
    const row = await port.chatConversations.get("p1", "c1");
    expect(row?.title).toBe("Original");
  });
});
