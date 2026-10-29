import type { Logger } from "@kaiord/core";
import type { FitWriterOptions } from "@kaiord/fit";

export type Toolset = "local" | "remote";

export type CreateServerOptions = {
  readonly toolset?: Toolset;
  readonly version?: string;
  readonly formatSpec?: string;
  readonly krdSchema?: string;
  readonly fitWriter?: FitWriterOptions;
  readonly logger?: Logger;
};
