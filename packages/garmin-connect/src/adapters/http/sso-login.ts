import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";
import type { FetchFn } from "./types";
import {
  GARMIN_SSO_EMBED,
  GC_MODERN,
  GARMIN_SSO_ORIGIN,
  SIGNIN_URL,
  USER_AGENT_BROWSER,
} from "./urls";
import { checkAccountLocked, checkPageTitle } from "./sso-validators";

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TICKET_RE = /ticket=([^"]+)"/;

const fetchCsrfToken = async (fetchFn: FetchFn): Promise<string> => {
  const signinParams = new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    locale: "en",
    gauthHost: GARMIN_SSO_EMBED,
  });
  const csrfRes = await fetchFn(`${SIGNIN_URL}?${signinParams}`);
  if (!csrfRes.ok) {
    throw createServiceAuthError(
      `SSO login page returned ${csrfRes.status}: ${csrfRes.statusText}`
    );
  }
  const csrfHtml = await csrfRes.text();
  const csrfMatch = CSRF_RE.exec(csrfHtml);
  if (!csrfMatch) {
    throw createServiceAuthError("CSRF token not found on login page");
  }
  return csrfMatch[1];
};

const submitLogin = async (
  username: string,
  password: string,
  csrf: string,
  fetchFn: FetchFn
): Promise<string> => {
  const loginParams = new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    clientId: "GarminConnect",
    locale: "en",
    gauthHost: GARMIN_SSO_EMBED,
    service: GARMIN_SSO_EMBED,
    source: GARMIN_SSO_EMBED,
    redirectAfterAccountLoginUrl: GARMIN_SSO_EMBED,
    redirectAfterAccountCreationUrl: GARMIN_SSO_EMBED,
  });
  const body = new URLSearchParams({
    username,
    password,
    embed: "true",
    _csrf: csrf,
  });
  const loginRes = await fetchFn(`${SIGNIN_URL}?${loginParams}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Dnt: "1",
      Origin: GARMIN_SSO_ORIGIN,
      Referer: SIGNIN_URL,
      "User-Agent": USER_AGENT_BROWSER,
    },
    body: body.toString(),
  });
  return loginRes.text();
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
  await fetchFn(`${GARMIN_SSO_EMBED}?${embedParams}`);

  const csrf = await fetchCsrfToken(fetchFn);
  const loginHtml = await submitLogin(username, password, csrf, fetchFn);

  checkAccountLocked(loginHtml);
  checkPageTitle(loginHtml, logger);

  const ticketMatch = TICKET_RE.exec(loginHtml);
  if (!ticketMatch) {
    throw createServiceAuthError(
      "Login failed: ticket not found. Check username and password."
    );
  }
  return ticketMatch[1];
};
