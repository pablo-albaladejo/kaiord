import {
  mkdir,
  readFile as fsReadFile,
  writeFile as fsWriteFile,
} from "fs/promises";
import { dirname } from "path";

const DANGEROUS_CHARS = /[\0|;&`$(){}!\n\r]/;
const PATH_TRAVERSAL = /(?:^|[/\\])\.\.(?:[/\\]|$)/;

export const validatePathSecurity = (inputPath: string): void => {
  if (DANGEROUS_CHARS.test(inputPath)) {
    throw new Error(
      `Invalid path: dangerous characters detected in ${inputPath}`
    );
  }
  if (PATH_TRAVERSAL.test(inputPath)) {
    throw new Error(
      `Invalid path: directory traversal detected in ${inputPath}`
    );
  }
};

export const readFileAsBuffer = async (path: string): Promise<Uint8Array> => {
  validatePathSecurity(path);
  try {
    const buffer = await fsReadFile(path);
    return new Uint8Array(buffer);
  } catch (error) {
    throw createFileError(path, error);
  }
};

export const readFileAsText = async (path: string): Promise<string> => {
  validatePathSecurity(path);
  try {
    return await fsReadFile(path, "utf-8");
  } catch (error) {
    throw createFileError(path, error);
  }
};

export const writeOutputFile = async (
  path: string,
  data: Uint8Array | string
): Promise<void> => {
  validatePathSecurity(path);
  await mkdir(dirname(path), { recursive: true });
  if (data instanceof Uint8Array) {
    await fsWriteFile(path, data);
  } else {
    await fsWriteFile(path, data, "utf-8");
  }
};

const isNodeError = (e: unknown): e is NodeJS.ErrnoException =>
  e instanceof Error && "code" in e;

const createFileError = (path: string, error: unknown): Error => {
  if (isNodeError(error)) {
    if (error.code === "ENOENT") return new Error(`File not found: ${path}`);
    if (error.code === "EACCES") return new Error(`Permission denied: ${path}`);
  }
  return new Error(`Failed to read file: ${path}`);
};
