/**
 * useNotificationPermission — thin wrapper over the browser Notification
 * permission. There is no in-app notification scheduler yet; this exists so
 * the Settings "Notifications" toggle controls a real surface (the browser
 * permission) instead of being a dead control. `unsupported` covers
 * non-browser/test environments where `Notification` is absent.
 */

import { useCallback, useState } from "react";

export type NotificationPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

const readPermission = (): NotificationPermissionState =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

export const useNotificationPermission = () => {
  const [permission, setPermission] =
    useState<NotificationPermissionState>(readPermission);

  const request =
    useCallback(async (): Promise<NotificationPermissionState> => {
      if (typeof Notification === "undefined") return "unsupported";
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }, []);

  return { permission, request };
};
