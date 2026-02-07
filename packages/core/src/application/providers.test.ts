import { describe, expect, it, vi } from "vitest";
import type { FitReader } from "../ports/fit-reader";
import type { FitWriter } from "../ports/fit-writer";
import type { Logger } from "../ports/logger";
import type { TcxReader } from "../ports/tcx-reader";
import type { TcxValidator } from "../ports/tcx-validator";
import type { TcxWriter } from "../ports/tcx-writer";
import type { ZwiftReader } from "../ports/zwift-reader";
import type { ZwiftValidator } from "../ports/zwift-validator";
import type { ZwiftWriter } from "../ports/zwift-writer";
import { createDefaultProviders } from "./providers";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createMockFitAdapters = () => ({
  fitReader: vi.fn() as unknown as FitReader,
  fitWriter: vi.fn() as unknown as FitWriter,
});

const createMockTcxAdapters = () => ({
  tcxReader: vi.fn() as unknown as TcxReader,
  tcxWriter: vi.fn() as unknown as TcxWriter,
  tcxValidator: vi.fn() as unknown as TcxValidator,
});

const createMockZwoAdapters = () => ({
  zwiftReader: vi.fn() as unknown as ZwiftReader,
  zwiftWriter: vi.fn() as unknown as ZwiftWriter,
  zwiftValidator: vi.fn() as unknown as ZwiftValidator,
});

describe("createDefaultProviders", () => {
  it("should create core services without adapters", () => {
    // Act
    const providers = createDefaultProviders();

    // Assert - core services always present
    expect(providers.schemaValidator).toBeDefined();
    expect(providers.toleranceChecker).toBeDefined();
    expect(providers.logger).toBeDefined();

    // Assert - adapter services are undefined
    expect(providers.fitReader).toBeUndefined();
    expect(providers.fitWriter).toBeUndefined();
    expect(providers.tcxValidator).toBeUndefined();
    expect(providers.tcxReader).toBeUndefined();
    expect(providers.tcxWriter).toBeUndefined();
    expect(providers.zwiftValidator).toBeUndefined();
    expect(providers.zwiftReader).toBeUndefined();
    expect(providers.zwiftWriter).toBeUndefined();
    expect(providers.convertFitToKrd).toBeUndefined();
    expect(providers.convertKrdToFit).toBeUndefined();
    expect(providers.convertTcxToKrd).toBeUndefined();
    expect(providers.convertKrdToTcx).toBeUndefined();
    expect(providers.convertZwiftToKrd).toBeUndefined();
    expect(providers.convertKrdToZwift).toBeUndefined();
  });

  it("should use injected logger when provided", () => {
    // Arrange
    const mockLogger = createMockLogger();

    // Act
    const providers = createDefaultProviders(undefined, mockLogger);

    // Assert
    expect(providers.logger).toBe(mockLogger);
  });

  it("should wire FIT adapters when provided", () => {
    // Arrange
    const fitAdapters = createMockFitAdapters();

    // Act
    const providers = createDefaultProviders({ fit: fitAdapters });

    // Assert
    expect(providers.fitReader).toBe(fitAdapters.fitReader);
    expect(providers.fitWriter).toBe(fitAdapters.fitWriter);
    expect(providers.convertFitToKrd).toBeDefined();
    expect(typeof providers.convertFitToKrd).toBe("function");
    expect(providers.convertKrdToFit).toBeDefined();
    expect(typeof providers.convertKrdToFit).toBe("function");
  });

  it("should wire TCX adapters when provided", () => {
    // Arrange
    const tcxAdapters = createMockTcxAdapters();

    // Act
    const providers = createDefaultProviders({ tcx: tcxAdapters });

    // Assert
    expect(providers.tcxReader).toBe(tcxAdapters.tcxReader);
    expect(providers.tcxWriter).toBe(tcxAdapters.tcxWriter);
    expect(providers.tcxValidator).toBe(tcxAdapters.tcxValidator);
    expect(providers.convertTcxToKrd).toBeDefined();
    expect(typeof providers.convertTcxToKrd).toBe("function");
    expect(providers.convertKrdToTcx).toBeDefined();
    expect(typeof providers.convertKrdToTcx).toBe("function");
  });

  it("should wire ZWO adapters when provided", () => {
    // Arrange
    const zwoAdapters = createMockZwoAdapters();

    // Act
    const providers = createDefaultProviders({ zwo: zwoAdapters });

    // Assert
    expect(providers.zwiftReader).toBe(zwoAdapters.zwiftReader);
    expect(providers.zwiftWriter).toBe(zwoAdapters.zwiftWriter);
    expect(providers.zwiftValidator).toBe(zwoAdapters.zwiftValidator);
    expect(providers.convertZwiftToKrd).toBeDefined();
    expect(typeof providers.convertZwiftToKrd).toBe("function");
    expect(providers.convertKrdToZwift).toBeDefined();
    expect(typeof providers.convertKrdToZwift).toBe("function");
  });

  it("should wire all adapters when all provided", () => {
    // Arrange
    const fitAdapters = createMockFitAdapters();
    const tcxAdapters = createMockTcxAdapters();
    const zwoAdapters = createMockZwoAdapters();

    // Act
    const providers = createDefaultProviders({
      fit: fitAdapters,
      tcx: tcxAdapters,
      zwo: zwoAdapters,
    });

    // Assert - all adapter services present
    expect(providers.fitReader).toBeDefined();
    expect(providers.fitWriter).toBeDefined();
    expect(providers.tcxValidator).toBeDefined();
    expect(providers.tcxReader).toBeDefined();
    expect(providers.tcxWriter).toBeDefined();
    expect(providers.zwiftValidator).toBeDefined();
    expect(providers.zwiftReader).toBeDefined();
    expect(providers.zwiftWriter).toBeDefined();

    // Assert - all use cases present
    expect(providers.convertFitToKrd).toBeDefined();
    expect(providers.convertKrdToFit).toBeDefined();
    expect(providers.convertTcxToKrd).toBeDefined();
    expect(providers.convertKrdToTcx).toBeDefined();
    expect(providers.convertZwiftToKrd).toBeDefined();
    expect(providers.convertKrdToZwift).toBeDefined();
  });

  it("should create schemaValidator with logger", () => {
    // Arrange
    const mockLogger = createMockLogger();

    // Act
    const providers = createDefaultProviders(undefined, mockLogger);

    // Assert
    expect(providers.schemaValidator).toBeDefined();
    expect(providers.schemaValidator.validate).toBeDefined();
  });

  it("should create toleranceChecker with defaults", () => {
    // Act
    const providers = createDefaultProviders();

    // Assert
    expect(providers.toleranceChecker).toBeDefined();
    expect(providers.toleranceChecker.checkTime).toBeDefined();
    expect(providers.toleranceChecker.checkDistance).toBeDefined();
    expect(providers.toleranceChecker.checkPower).toBeDefined();
    expect(providers.toleranceChecker.checkHeartRate).toBeDefined();
    expect(providers.toleranceChecker.checkCadence).toBeDefined();
    expect(providers.toleranceChecker.checkPace).toBeDefined();
  });

  it("should not create FIT use cases without adapters", () => {
    // Act
    const providers = createDefaultProviders({ tcx: createMockTcxAdapters() });

    // Assert - TCX wired
    expect(providers.convertTcxToKrd).toBeDefined();
    expect(providers.convertKrdToTcx).toBeDefined();

    // Assert - FIT not wired
    expect(providers.fitReader).toBeUndefined();
    expect(providers.fitWriter).toBeUndefined();
    expect(providers.convertFitToKrd).toBeUndefined();
    expect(providers.convertKrdToFit).toBeUndefined();
  });
});
