import {
  FitParsingError,
  GarminParsingError,
  KrdValidationError,
  ServiceApiError,
  ServiceAuthError,
  ToleranceExceededError,
} from "@kaiord/core";

import {
  DirectoryCreateError,
  EnvironmentError,
  UnsupportedFormatError,
} from "./cli-errors.js";
import { isEnvironmentDependencyError } from "./environment-error-signatures.js";
import type { ExitCodeValue } from "./exit-codes.js";
import { ExitCode } from "./exit-codes.js";

/** Node.js error codes that indicate an external-service / network failure. */
const NETWORK_ERROR_CODES: ReadonlySet<string> = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "code" in error) {
    const { code } = error as { code: unknown };
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
};

const isNetworkError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code !== undefined && NETWORK_ERROR_CODES.has(code)) return true;
  // Node's global fetch surfaces connection failures as `TypeError: fetch failed`.
  return error instanceof TypeError && error.message.includes("fetch failed");
};

/** Exit codes keyed on the `name` of domain errors that carry no class here. */
const ERROR_NAME_TO_EXIT_CODE: Record<string, ExitCodeValue> = {
  FitParsingError: ExitCode.PARSING_ERROR,
  GarminParsingError: ExitCode.PARSING_ERROR,
  KrdValidationError: ExitCode.VALIDATION_ERROR,
  ToleranceExceededError: ExitCode.TOLERANCE_EXCEEDED,
  InvalidArgumentError: ExitCode.INVALID_ARGUMENT,
  UnsupportedFormatError: ExitCode.INVALID_ARGUMENT,
  ServiceAuthError: ExitCode.AUTH_ERROR,
  DirectoryCreateError: ExitCode.DIRECTORY_CREATE_ERROR,
  EnvironmentError: ExitCode.ENVIRONMENT_ERROR,
  ServiceApiError: ExitCode.SERVICE_ERROR,
};

const getErrorName = (error: unknown): string | undefined => {
  if (error && typeof error === "object" && "name" in error) {
    const { name } = error as { name: unknown };
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
};

type InstanceRule = readonly [
  new (...args: never[]) => Error,
  ExitCodeValue,
];

/**
 * Typed-class rules, most specific first. Class checks survive cross-realm
 * name spoofing; the name table below covers errors thrown across package
 * boundaries where `instanceof` would fail.
 */
const INSTANCE_RULES: ReadonlyArray<InstanceRule> = [
  [FitParsingError, ExitCode.PARSING_ERROR],
  [GarminParsingError, ExitCode.PARSING_ERROR],
  [KrdValidationError, ExitCode.VALIDATION_ERROR],
  [ToleranceExceededError, ExitCode.TOLERANCE_EXCEEDED],
  [UnsupportedFormatError, ExitCode.INVALID_ARGUMENT],
  [DirectoryCreateError, ExitCode.DIRECTORY_CREATE_ERROR],
  [EnvironmentError, ExitCode.ENVIRONMENT_ERROR],
  [ServiceAuthError, ExitCode.AUTH_ERROR],
  [ServiceApiError, ExitCode.SERVICE_ERROR],
];

const classifyByInstance = (error: unknown): ExitCodeValue | undefined => {
  for (const [ErrorClass, code] of INSTANCE_RULES) {
    if (error instanceof ErrorClass) return code;
  }
  return undefined;
};

/** Classify by raw Node system-error signatures (dependency, network, fs). */
const classifyBySignature = (error: unknown): ExitCodeValue | undefined => {
  if (isEnvironmentDependencyError(error)) return ExitCode.ENVIRONMENT_ERROR;
  if (isNetworkError(error)) return ExitCode.SERVICE_ERROR;

  const code = getErrorCode(error);
  if (code === "ENOENT") return ExitCode.FILE_NOT_FOUND;
  if (code === "EACCES") return ExitCode.PERMISSION_DENIED;
  return undefined;
};

const classifyByName = (error: unknown): ExitCodeValue | undefined => {
  const name = getErrorName(error);
  return name === undefined ? undefined : ERROR_NAME_TO_EXIT_CODE[name];
};

/**
 * The single CLI error-to-exit-code mapper. Classifies every failure by error
 * class (`instanceof`), Node system-error signature, or `error.name` — never by
 * message text, so rewording an error never changes its exit code.
 */
export const mapErrorToExitCode = (error: unknown): ExitCodeValue =>
  classifyByInstance(error) ??
  classifyBySignature(error) ??
  classifyByName(error) ??
  ExitCode.UNKNOWN_ERROR;

/**
 * Backwards-compatible alias used by the CLI entrypoint.
 * @deprecated Prefer {@link mapErrorToExitCode}.
 */
export const getExitCodeForError = mapErrorToExitCode;
