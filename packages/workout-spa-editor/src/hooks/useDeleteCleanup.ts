/**
 * useDeleteCleanup Hook
 *
 * Requirement 39.3: Delete with Undo Notification
 * - Automatically cleans up expired deleted steps after 5 seconds
 * - Runs cleanup check every second
 */

import { useEffect } from "react";
import { useClearExpiredDeletes } from "../store";

export const useDeleteCleanup = () => {
  const clearExpiredDeletes = useClearExpiredDeletes();

  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredDeletes();
    }, 1000);

    return () => clearInterval(interval);
  }, [clearExpiredDeletes]);
};
