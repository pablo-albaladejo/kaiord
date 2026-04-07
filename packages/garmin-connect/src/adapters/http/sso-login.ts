import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";

import { logCsrfResult, logLoginHtmlDiagnostics } from "./sso-html-diagnostics";
import { submitLogin } from "./sso-submit";
import { checkAccountLocked, checkPageTitle } from "./sso-validators";
import type { FetchFn } from "./types";
import { GARMIN_SSO_EMBED, SIGNIN_URL, USER_AGENT_SSO } from "./urls";

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TICKET_RE = /ticket=([^"]+)"/;

const buildSigninParams = (): URLSearchParams =>
  new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    gauthHost: GARMIN_SSO_EMBED,
    service: GARMIN_SSO_EMBED,
    source: GARMIN_SSO_EMBED,
    redirectAfterAccountLoginUrl: GARMIN_SSO_EMBED,
    redirectAfterAccountCreationUrl: GARMIN_SSO_EMBED,
  });

const fetchCsrfToken = async (
  fetchFn: FetchFn,
  embedUrl: string,
  logger: Logger
): Promise<string> => {
  logger.debug("[SSO] Fetching CSRF token");
  const signinParams = buildSigninParams();
  const csrfRes = await fetchFn(`${SIGNIN_URL}?${signinParams}`, {
    headers: {
      "User-Agent": USER_AGENT_SSO,
      Referer: embedUrl,
    },
  });
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
    id: "gauth-widget",
    embedWidget: "true",
    gauthHost: "https://sso.garmin.com/sso",
  });
  const embedUrl = `${GARMIN_SSO_EMBED}?${embedParams}`;
  const embedRes = await fetchFn(embedUrl, {
    headers: { "User-Agent": USER_AGENT_SSO },
  });
  logger.debug("[SSO] Embed bootstrap", { status: embedRes.status });
  if (!embedRes.ok) {
    throw createServiceAuthError(
      `SSO embed bootstrap failed: ${embedRes.status} ${embedRes.statusText}`
    );
  }

  const csrf = await fetchCsrfToken(fetchFn, embedUrl, logger);
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
