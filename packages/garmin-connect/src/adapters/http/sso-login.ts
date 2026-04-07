import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";

import { logCsrfResult, logLoginHtmlDiagnostics } from "./sso-html-diagnostics";
import { submitLogin } from "./sso-submit";
import { checkAccountLocked, checkPageTitle } from "./sso-validators";
import type { FetchFn } from "./types";
import { GARMIN_SSO_EMBED, GC_MODERN, SIGNIN_URL } from "./urls";

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TICKET_RE = /ticket=([^"]+)"/;

const fetchCsrfToken = async (
  fetchFn: FetchFn,
  logger: Logger
): Promise<string> => {
  logger.debug("[SSO] Fetching CSRF token");
  const signinParams = new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    locale: "en",
    gauthHost: GARMIN_SSO_EMBED,
  });
  const csrfRes = await fetchFn(`${SIGNIN_URL}?${signinParams}`);
  const csrfHtml = await csrfRes.text();
  const csrfMatch = CSRF_RE.exec(csrfHtml);
  const size = new TextEncoder().encode(csrfHtml).byteLength;
  logCsrfResult(logger, csrfRes.status, size, !!csrfMatch);
  if (!csrfRes.ok) {
    throw createServiceAuthError(
      `SSO login page returned ${csrfRes.status}: ${csrfRes.statusText}`
    );
  }
  if (!csrfMatch) {
    throw createServiceAuthError("CSRF token not found on login page");
  }
  return csrfMatch[1];
};

export const getLoginTicket = async (
  username: string,
  password: string,
  fetchFn: FetchFn,
  logger: Logger
): Promise<string> => {
  const embedParams = new URLSearchParams({
    clientId: "GarminConnect",
    locale: "en",
    service: GC_MODERN,
  });
  const embedRes = await fetchFn(`${GARMIN_SSO_EMBED}?${embedParams}`);
  logger.debug("[SSO] Embed bootstrap", { status: embedRes.status });
  if (!embedRes.ok) {
    throw createServiceAuthError(
      `SSO embed bootstrap failed: ${embedRes.status} ${embedRes.statusText}`
    );
  }

  const csrf = await fetchCsrfToken(fetchFn, logger);
  const { html: loginHtml } = await submitLogin({
    username,
    password,
    csrf,
    fetchFn,
    logger,
  });

  checkAccountLocked(loginHtml);
  checkPageTitle(loginHtml, logger);

  const ticketMatch = TICKET_RE.exec(loginHtml);
  logLoginHtmlDiagnostics(loginHtml, !!ticketMatch, logger);
  if (!ticketMatch) {
    throw createServiceAuthError(
      "Login failed: ticket not found. Check username and password."
    );
  }
  return ticketMatch[1];
};
