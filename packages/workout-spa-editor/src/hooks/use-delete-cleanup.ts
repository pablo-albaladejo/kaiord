/**
 * useDeleteCleanup Hook
 *
 * Requirement 39.3: Delete with Undo Notification
 * - Automatically cleans up expired deleted steps after 5 seconds
 * - Runs cleanup check every second
 */

import { useEffect } from "react";

import { useClearExpiredDeletes } from "../store";
import { UNDO_DELETE_CLEANUP_TICK_MS } from "../store/actions/delete-undo-constants";

export const useDeleteCleanup = () => {
  const clearExpiredDeletes = useClearExpiredDeletes();

  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredDeletes();
    }, UNDO_DELETE_CLEANUP_TICK_MS);

    return () => clearInterval(interval);
  }, [clearExpiredDeletes]);
};
