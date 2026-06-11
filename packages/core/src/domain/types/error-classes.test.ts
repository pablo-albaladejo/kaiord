import { describe, expect, it } from "vitest";

import {
  createFitParsingError,
  createKrdValidationError,
  createTcxParsingError,
  createToleranceExceededError,
  createZwiftParsingError,
  createZwiftValidationError,
  FitParsingError,
  KrdValidationError,
  TcxParsingError,
  ToleranceExceededError,
  ZwiftParsingError,
  ZwiftValidationError,
} from "./errors";

type ParsingErrorCtor = new (message: string, cause?: unknown) => Error & {
  cause?: unknown;
};

const parsingErrorCases: ReadonlyArray<readonly [ParsingErrorCtor, string]> = [
  [FitParsingError, "FitParsingError"],
  [TcxParsingError, "TcxParsingError"],
  [ZwiftParsingError, "ZwiftParsingError"],
];

describe("Domain Errors", () => {
  describe("parsing errors", () => {
    it.each(parsingErrorCases)(
      "should build a named %s carrying message, cause, stack, and instanceof identity",
      (ErrorCtor, name) => {
        // Arrange
        const message = `Failed in ${name}`;
        const cause = new Error("Underlying cause");

        // Act
        const withoutCause = new ErrorCtor(message);
        const withCause = new ErrorCtor(message, cause);

        // Assert
        expect(withoutCause).toBeInstanceOf(Error);
        expect(withoutCause).toBeInstanceOf(ErrorCtor);
        expect(withoutCause.name).toBe(name);
        expect(withoutCause.message).toBe(message);
        expect(withoutCause.cause).toBeUndefined();
        expect(withoutCause.stack).toContain(name);
        expect(withCause.cause).toBe(cause);
      }
    );

    it("should keep parsing error types distinct under instanceof", () => {
      // Arrange
      const fitError = new FitParsingError("fit");

      // Act
      const isTcx = fitError instanceof TcxParsingError;
      const isZwift = fitError instanceof ZwiftParsingError;

      // Assert
      expect(isTcx).toBe(false);
      expect(isZwift).toBe(false);
    });
  });

  describe("createParsingError factories", () => {
    it.each([
      [createFitParsingError, FitParsingError, "FitParsingError"],
      [createTcxParsingError, TcxParsingError, "TcxParsingError"],
      [createZwiftParsingError, ZwiftParsingError, "ZwiftParsingError"],
    ] as const)(
      "should delegate to the %#th parsing constructor preserving message and cause",
      (factory, ErrorCtor, name) => {
        // Arrange
        const message = `Factory ${name}`;
        const cause = new Error("Original error");

        // Act
        const error = factory(message, cause);

        // Assert
        expect(error).toBeInstanceOf(ErrorCtor);
        expect(error.message).toBe(message);
        expect(error.cause).toBe(cause);
      }
    );
  });

  describe("aggregate errors", () => {
    const krdErrors = [
      { field: "version", message: "Required field missing" },
      { field: "type", message: "Invalid value" },
    ];
    const violations = [
      { field: "power", expected: 250, actual: 252, deviation: 2, tolerance: 1 },
    ];
    const zwiftErrors = [
      { path: "workout_file.name", message: "Required attribute missing" },
    ];

    it("should build a KrdValidationError carrying its message and errors array", () => {
      // Arrange

      // Act
      const error = new KrdValidationError("KRD validation failed", krdErrors);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(KrdValidationError);
      expect(error.name).toBe("KrdValidationError");
      expect(error.message).toBe("KRD validation failed");
      expect(error.errors).toStrictEqual(krdErrors);
      expect(error.stack).toBeDefined();
      expect(error instanceof FitParsingError).toBe(false);
    });

    it("should build a ToleranceExceededError carrying its message and violations array", () => {
      // Arrange

      // Act
      const error = new ToleranceExceededError("Tolerance exceeded", violations);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ToleranceExceededError);
      expect(error.name).toBe("ToleranceExceededError");
      expect(error.message).toBe("Tolerance exceeded");
      expect(error.violations).toStrictEqual(violations);
      expect(error.stack).toBeDefined();
      expect(error instanceof KrdValidationError).toBe(false);
    });

    it("should build a ZwiftValidationError carrying its message and errors array", () => {
      // Arrange

      // Act
      const error = new ZwiftValidationError("Zwift validation failed", [
        ...zwiftErrors,
      ]);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ZwiftValidationError);
      expect(error.name).toBe("ZwiftValidationError");
      expect(error.message).toBe("Zwift validation failed");
      expect(error.errors).toStrictEqual(zwiftErrors);
      expect(error.stack).toBeDefined();
      expect(error instanceof FitParsingError).toBe(false);
    });

    it("should accept an empty aggregate array", () => {
      // Arrange

      // Act
      const error = new KrdValidationError("Validation failed", []);

      // Assert
      expect(error.errors).toStrictEqual([]);
    });
  });

  describe("createAggregate factories", () => {
    it("should create a KrdValidationError via factory preserving errors", () => {
      // Arrange
      const errors = [{ field: "test", message: "test error" }];

      // Act
      const error = createKrdValidationError("Factory test", errors);

      // Assert
      expect(error).toBeInstanceOf(KrdValidationError);
      expect(error.message).toBe("Factory test");
      expect(error.errors).toStrictEqual(errors);
    });

    it("should create a ToleranceExceededError via factory preserving violations", () => {
      // Arrange
      const violations = [
        { field: "test", expected: 100, actual: 105, deviation: 5, tolerance: 1 },
      ];

      // Act
      const error = createToleranceExceededError("Factory test", violations);

      // Assert
      expect(error).toBeInstanceOf(ToleranceExceededError);
      expect(error.message).toBe("Factory test");
      expect(error.violations).toStrictEqual(violations);
    });

    it("should create a ZwiftValidationError via factory preserving errors", () => {
      // Arrange
      const errors = [{ path: "test.field", message: "test error" }];

      // Act
      const error = createZwiftValidationError("Factory test", errors);

      // Assert
      expect(error).toBeInstanceOf(ZwiftValidationError);
      expect(error.message).toBe("Factory test");
      expect(error.errors).toStrictEqual(errors);
    });
  });
});
