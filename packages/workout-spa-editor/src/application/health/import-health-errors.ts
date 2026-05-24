import type { HealthFileType } from "@kaiord/core";

export class UnsupportedHealthKrdError extends Error {
  readonly fileType: string;
  constructor(fileType: string) {
    super(`Unsupported KRD file type for health import: ${fileType}`);
    this.name = "UnsupportedHealthKrdError";
    this.fileType = fileType;
  }
}

export class MissingHealthPayloadError extends Error {
  readonly fileType: HealthFileType;
  constructor(fileType: HealthFileType) {
    super(`KRD ${fileType} is missing extensions.health payload`);
    this.name = "MissingHealthPayloadError";
    this.fileType = fileType;
  }
}
