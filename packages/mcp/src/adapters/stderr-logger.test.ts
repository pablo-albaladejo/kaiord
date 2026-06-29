import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { createStderrLogger } from "./stderr-logger";

describe("createStderrLogger", () => {
  it.each<{
    method: keyof Logger;
    message: string;
    context: Record<string, unknown> | undefined;
    label: string;
  }>([
    {
      method: "debug",
      message: "test message",
      context: { key: "value" },
      label: "[DEBUG] test message",
    },
    {
      method: "info",
      message: "test message",
      context: undefined,
      label: "[INFO] test message",
    },
    {
      method: "warn",
      message: "warning",
      context: { detail: "info" },
      label: "[WARN] warning",
    },
    {
      method: "error",
      message: "error occurred",
      context: undefined,
      label: "[ERROR] error occurred",
    },
  ])(
    "should write $method messages to stderr",
    ({ method, message, context, label }) => {
      // Arrange
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createStderrLogger();

      // Act
      logger[method](message, context);

      // Assert
      expect(spy).toHaveBeenCalledWith(label, context ?? "");
      spy.mockRestore();
    }
  );
});
