import type { HealthFileType } from "@kaiord/core";

export class UnsupportedHealthKrdError extends Error {
  constructor(public readonly fileType: string) {
    super(`Unsupported KRD file type for health import: ${fileType}`);
    this.name = "UnsupportedHealthKrdError";
  }
}

export class MissingHealthPayloadError extends Error {
  constructor(public readonly fileType: HealthFileType) {
    super(`KRD ${fileType} is missing extensions.health payload`);
    this.name = "MissingHealthPayloadError";
  }
}
