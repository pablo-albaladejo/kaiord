import { describe, expect, it, vi } from "vitest";

import { postRequest, rpc } from "./test-utils/mcp-request";
import worker from "./worker";

const HTTP_OK = 200;
const HTTP_TOO_MANY_REQUESTS = 429;

describe("worker entry", () => {
  it("should hand the bound rate limiter to the handler", async () => {
    // Arrange
    const limit = vi.fn(async () => ({ success: false }));

    // Act
    const response = await worker.fetch(postRequest(rpc("tools/list")), {
      MCP_RATE_LIMITER: { limit },
    });

    // Assert
    expect(response.status).toBe(HTTP_TOO_MANY_REQUESTS);
    expect(limit).toHaveBeenCalledTimes(1);
  });

  it("should serve without a limiter when none is bound", async () => {
    // Arrange
    const env = {};

    // Act
    const response = await worker.fetch(postRequest(rpc("tools/list")), env);

    // Assert
    expect(response.status).toBe(HTTP_OK);
  });
});
