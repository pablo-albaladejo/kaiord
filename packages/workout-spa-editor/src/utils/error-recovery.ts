/**
 * Error Recovery Utility
 *
 * Utilities for performing operations with automatic error recovery.
 *
 * Requirements:
 * - Requirement 36.5: Restore previous state on error
 */

import type { KRD } from "../types/krd";

/**
 * Result of an operation with error recovery
 */
export type RecoveryResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
  recovered: boolean;
};

/**
 * Build the failure branch of a recovery result: coerce the thrown value to
 * an Error and restore from backup when one was captured.
 */
const toRecoveryFailure = <T>(
  error: unknown,
  backup: KRD | null,
  onRestore: (state: KRD) => void
): RecoveryResult<T> => {
  const err = error instanceof Error ? error : new Error(String(error));
  if (backup) {
    onRestore(backup);
    return { success: false, error: err, recovered: true };
  }
  return { success: false, error: err, recovered: false };
};

/**
 * Execute an operation with automatic backup and recovery
 *
 * @param operation - The operation to execute
 * @param currentState - The current state to backup
 * @param onRestore - Callback to restore state if operation fails
 * @returns Result indicating success, data, error, and whether recovery was performed
 */
export const withErrorRecovery = async <T>(
  operation: () => Promise<T> | T,
  currentState: KRD | null,
  onRestore: (state: KRD) => void
): Promise<RecoveryResult<T>> => {
  const backup = currentState ? structuredClone(currentState) : null;
  try {
    return { success: true, data: await operation(), recovered: false };
  } catch (error) {
    return toRecoveryFailure(error, backup, onRestore);
  }
};

/**
 * Execute a synchronous operation with automatic backup and recovery
 */
export const withErrorRecoverySync = <T>(
  operation: () => T,
  currentState: KRD | null,
  onRestore: (state: KRD) => void
): RecoveryResult<T> => {
  const backup = currentState ? structuredClone(currentState) : null;
  try {
    return { success: true, data: operation(), recovered: false };
  } catch (error) {
    return toRecoveryFailure(error, backup, onRestore);
  }
};
