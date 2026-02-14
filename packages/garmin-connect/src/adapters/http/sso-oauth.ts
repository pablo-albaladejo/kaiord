import { createServiceAuthError } from "@kaiord/core";
import type { FetchFn, OAuthConsumer } from "./types";
import { createOAuthSigner } from "./oauth-signer";
import { GARMIN_SSO_EMBED, OAUTH_URL, USER_AGENT_MOBILE } from "./urls";
import type { OAuth1Token, OAuth2Token } from "./types";

export const getOAuth1Token = async (
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
  const token = {
    key: oauth1.oauth_token,
    secret: oauth1.oauth_token_secret,
  };
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
