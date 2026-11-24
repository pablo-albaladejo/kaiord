/**
 * What the Connector asks Train2Go for. Each path must match one entry of
 * the extension's closed list (`ALLOWED` in packages/train2go-bridge/
 * background.js); anything else is refused by the extension unsent.
 */

export const weeklyPath = (date: string, userId: string): string =>
  `/api/v2/workplan/weekly/${date}?user=${userId}`;

export const dailyPath = (date: string, userId: string): string =>
  `/api/v2/workplan/daily/${date}?user=${userId}&source=sidebar`;

export const DETAILS_PATH = "/user/details";

export const PROFILE_PING_PATH = "/api/v2/profile/ping";
