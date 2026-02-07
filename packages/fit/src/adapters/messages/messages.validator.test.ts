import { describe, expect, it, vi } from "vitest";
import type { FitMessages } from "../shared/types";
import { validateMessages } from "./messages.validator";

const createMockLogger = () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("validateMessages", () => {
  const emptyMessages: FitMessages = {};

  describe("strict mode (default)", () => {
    it("should throw when fileId is missing", () => {
      const logger = createMockLogger();

      expect(() =>
        validateMessages(undefined, { sport: "cycling" }, emptyMessages, logger)
      ).toThrow("Missing required fileId message in FIT file");
    });

    it("should throw when workout message is missing", () => {
      const logger = createMockLogger();

      expect(() =>
        validateMessages(
          { type: "structured_workout" },
          undefined,
          emptyMessages,
          logger
        )
      ).toThrow("Missing required workout message in FIT file");
    });

    it("should not throw when both messages present", () => {
      const logger = createMockLogger();

      expect(() =>
        validateMessages(
          { type: "structured_workout" },
          { sport: "cycling" },
          emptyMessages,
          logger
        )
      ).not.toThrow();
    });
  });

  describe("non-strict mode", () => {
    it("should warn instead of throw when fileId is missing", () => {
      const logger = createMockLogger();

      expect(() =>
        validateMessages(
          undefined,
          { sport: "cycling" },
          emptyMessages,
          logger,
          { strict: false }
        )
      ).not.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        "Missing required fileId message in FIT file"
      );
    });

    it("should warn instead of throw when workout message is missing", () => {
      const logger = createMockLogger();

      expect(() =>
        validateMessages(
          { type: "structured_workout" },
          undefined,
          emptyMessages,
          logger,
          { strict: false }
        )
      ).not.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        "Missing required workout message in FIT file"
      );
    });
  });

  describe("multiple workout messages warning", () => {
    it("should warn when multiple workout messages are found", () => {
      const logger = createMockLogger();
      const messages: FitMessages = {
        workoutMesgs: [{ sport: "cycling" }, { sport: "running" }],
      };

      validateMessages(
        { type: "structured_workout" },
        { sport: "cycling" },
        messages,
        logger
      );

      expect(logger.warn).toHaveBeenCalledWith(
        "Multiple workout messages found, using first one",
        { count: 2 }
      );
    });
  });
});
