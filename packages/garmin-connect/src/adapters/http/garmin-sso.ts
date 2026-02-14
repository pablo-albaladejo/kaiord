import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";
import type { OAuthConsumer } from "./oauth-signer";
import { createOAuthSigner } from "./oauth-signer";
import {
  GARMIN_SSO_EMBED,
  GC_MODERN,
  OAUTH_CONSUMER_URL,
  OAUTH_URL,
  SIGNIN_URL,
  GARMIN_SSO_ORIGIN,
  USER_AGENT_BROWSER,
  USER_AGENT_MOBILE,
} from "./urls";

export type OAuth1Token = {
  oauth_token: string;
  oauth_token_secret: string;
};

export type OAuth2Token = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in: number;
  expires_at: number;
};

export type SsoResult = { oauth1: OAuth1Token; oauth2: OAuth2Token };

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TICKET_RE = /ticket=([^"]+)"/;
const ACCOUNT_LOCKED_RE = /var status\s*=\s*"([^"]*)"/;
const PAGE_TITLE_RE = /<title>([^<]*)<\/title>/;

type FetchFn = typeof globalThis.fetch;

const fetchOAuthConsumer = async (fetchFn: FetchFn): Promise<OAuthConsumer> => {
  const res = await fetchFn(OAUTH_CONSUMER_URL);
  if (!res.ok) {
    throw createServiceAuthError(
      `Failed to fetch OAuth consumer: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as {
    consumer_key: string;
    consumer_secret: string;
  };
  return { key: data.consumer_key, secret: data.consumer_secret };
};

const getLoginTicket = async (
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

  const signinParams = new URLSearchParams({
    id: "gauth-widget",
    embedWidget: "true",
    locale: "en",
    gauthHost: GARMIN_SSO_EMBED,
  });
  const csrfRes = await fetchFn(`${SIGNIN_URL}?${signinParams}`);
  const csrfHtml = await csrfRes.text();
  const csrfMatch = CSRF_RE.exec(csrfHtml);
  if (!csrfMatch) {
    throw createServiceAuthError("CSRF token not found on login page");
  }

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
    _csrf: csrfMatch[1],
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
  const loginHtml = await loginRes.text();

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

const checkAccountLocked = (html: string): void => {
  const match = ACCOUNT_LOCKED_RE.exec(html);
  if (match && match[1] === "ACCOUNT_LOCKED") {
    throw createServiceAuthError(
      `Account locked: ${match[1]}. Unlock via Garmin Connect web.`
    );
  }
};

const checkPageTitle = (html: string, logger: Logger): void => {
  const match = PAGE_TITLE_RE.exec(html);
  if (match?.[1]?.includes("Update Phone Number")) {
    throw createServiceAuthError("Login failed: phone number update required.");
  }
  if (match) {
    logger.debug("Login page title", { title: match[1] });
  }
};

const getOAuth1Token = async (
  ticket: string,
  consumer: OAuthConsumer,
  fetchFn: FetchFn
): Promise<OAuth1Token> => {
  const signer = createOAuthSigner(consumer);
  const params = new URLSearchParams({
    ticket,
    "login-url": GARMIN_SSO_EMBED,
    "accepts-mfa-tokens": "true",
  });
  const url = `${OAUTH_URL}/preauthorized?${params}`;
  const headers = signer.toHeader({ url, method: "GET" });

  const res = await fetchFn(url, {
    headers: { ...headers, "User-Agent": USER_AGENT_MOBILE },
  });
  if (!res.ok) {
    throw createServiceAuthError(
      `OAuth1 token request failed: ${res.status} ${res.statusText}`
    );
  }
  const text = await res.text();
  const parsed = new URLSearchParams(text);

  const oauthToken = parsed.get("oauth_token");
  const oauthTokenSecret = parsed.get("oauth_token_secret");
  if (!oauthToken || !oauthTokenSecret) {
    throw createServiceAuthError("OAuth1 token exchange failed");
  }

  return { oauth_token: oauthToken, oauth_token_secret: oauthTokenSecret };
};

export const exchangeOAuth2 = async (
  oauth1: OAuth1Token,
  consumer: OAuthConsumer,
  fetchFn: FetchFn
): Promise<OAuth2Token> => {
  const signer = createOAuthSigner(consumer);
  const baseUrl = `${OAUTH_URL}/exchange/user/2.0`;
  const token = { key: oauth1.oauth_token, secret: oauth1.oauth_token_secret };
  const authHeader = signer.toHeader({ url: baseUrl, method: "POST" }, token);

  const res = await fetchFn(baseUrl, {
    method: "POST",
    headers: {
      ...authHeader,
      "User-Agent": USER_AGENT_MOBILE,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  if (!res.ok) {
    throw createServiceAuthError(
      `OAuth2 exchange failed: ${res.status} ${res.statusText}`
    );
  }
  const data = (await res.json()) as OAuth2Token;

  return {
    ...data,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  };
};

/**
 * Garmin Connect SSO login flow.
 * The fetchFn must be cookie-aware (persist cookies across requests).
 * Use fetch-cookie or similar wrapper for Node.js environments.
 */
export const garminSso = async (
  username: string,
  password: string,
  logger: Logger,
  fetchFn: FetchFn = globalThis.fetch
): Promise<SsoResult> => {
  logger.info("Starting Garmin Connect SSO login");

  const consumer = await fetchOAuthConsumer(fetchFn);
  const ticket = await getLoginTicket(username, password, fetchFn, logger);
  logger.debug("SSO ticket obtained");

  const oauth1 = await getOAuth1Token(ticket, consumer, fetchFn);
  logger.debug("OAuth1 token obtained");

  const oauth2 = await exchangeOAuth2(oauth1, consumer, fetchFn);
  logger.info("Garmin Connect SSO login successful");

  return { oauth1, oauth2 };
};
