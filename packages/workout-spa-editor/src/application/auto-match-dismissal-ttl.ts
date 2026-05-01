/**
 * Single source of truth for the auto-match banner dismissal expiry.
 * Tuning the TTL (e.g., from 24h to 12h) means changing only this constant.
 */

export const DISMISSAL_TTL_MS = 24 * 60 * 60 * 1000;
