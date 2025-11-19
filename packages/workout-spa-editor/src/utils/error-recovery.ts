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
  // Create backup
  const backup = currentState ? structuredClone(currentState) : null;

  try {
    const result = await operation();
    return {
      success: true,
      data: result,
      recovered: false,
    };
  } catch (error) {
    // Restore from backup if available
    if (backup) {
      onRestore(backup);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recovered: true,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      recovered: false,
    };
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
  // Create backup
  const backup = currentState ? structuredClone(currentState) : null;

  try {
    const result = operation();
    return {
      success: true,
      data: result,
      recovered: false,
    };
  } catch (error) {
    // Restore from backup if available
    if (backup) {
      onRestore(backup);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        recovered: true,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      recovered: false,
    };
  }
};
