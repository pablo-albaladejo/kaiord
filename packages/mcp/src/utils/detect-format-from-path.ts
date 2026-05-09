import { extname } from "path";

import type { FileFormat } from "../types/tool-schemas";
import { FORMAT_REGISTRY } from "./format-registry";

export const detectFormatFromPath = (filePath: string): FileFormat | null => {
  const ext = extname(filePath).toLowerCase();
  if (!ext) return null;
  const entry = Object.entries(FORMAT_REGISTRY).find(
    ([, desc]) => desc.extension === ext
  );
  return entry ? (entry[0] as FileFormat) : null;
};
