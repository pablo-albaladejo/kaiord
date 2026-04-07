import type { Logger } from "@kaiord/core";

const PAGE_TITLE_RE = /<title>([^<]*)<\/title>/;

const extractTitle = (html: string): string => {
  const match = PAGE_TITLE_RE.exec(html);
  return match?.[1] ?? "unknown";
};

export const logCsrfResult = (
  logger: Logger,
  status: number,
  size: number,
  found: boolean
): void => {
  logger.debug("[SSO] CSRF fetch", { status, size });
  if (!found) logger.warn("[SSO] CSRF token not found in response");
};

export const logLoginResponse = (
  logger: Logger,
  status: number,
  size: number
): void => {
  logger.debug("[SSO] Login response", { status, size });
};

export const logLoginHtmlDiagnostics = (
  html: string,
  ticketFound: boolean,
  logger: Logger
): void => {
  const title = extractTitle(html);
  const size = new TextEncoder().encode(html).byteLength;
  logger.debug("[SSO] Page title", { title });
  if (/\bmfa\b/i.test(html)) logger.warn("[SSO] MFA detected");
  if (/\berror\b/i.test(html)) logger.warn("[SSO] Error indicators found");
  if (ticketFound) {
    logger.debug("[SSO] Ticket found in HTML");
  } else {
    logger.warn("[SSO] Ticket not found in HTML", { size, title });
  }
};
