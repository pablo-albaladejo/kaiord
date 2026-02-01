/**
 * File system error utilities
 */

/**
 * Type guard for Node.js system errors with error codes
 */
type NodeSystemError = Error & { code: string };

export const isNodeSystemError = (error: unknown): error is NodeSystemError => {
  return error instanceof Error && "code" in error;
};
