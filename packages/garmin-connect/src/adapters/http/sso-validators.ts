import type { Logger } from "@kaiord/core";
import { createServiceAuthError } from "@kaiord/core";

const ACCOUNT_LOCKED_RE = /var status\s*=\s*"([^"]*)"/;
const PAGE_TITLE_RE = /<title>([^<]*)<\/title>/;

export const checkAccountLocked = (html: string): void => {
  const match = ACCOUNT_LOCKED_RE.exec(html);
  if (match && match[1] === "ACCOUNT_LOCKED") {
    throw createServiceAuthError(
      `Account locked: ${match[1]}. Unlock via Garmin Connect web.`
    );
  }
};

export const checkPageTitle = (html: string, logger: Logger): void => {
  const match = PAGE_TITLE_RE.exec(html);
  if (match?.[1]?.includes("Update Phone Number")) {
    throw createServiceAuthError("Login failed: phone number update required.");
  }
  if (match) {
    logger.debug("Login page title", { title: match[1] });
  }
};
