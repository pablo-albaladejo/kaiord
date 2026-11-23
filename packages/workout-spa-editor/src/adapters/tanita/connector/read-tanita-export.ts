/**
 * Reading MyTANITA's raw answer to the export, which the Tanita Bridge
 * hands over unread. A 200 whose body is an HTML document, not CSV, means
 * MyTANITA served its login page in place of the export: the Session is
 * dead although no redirect fired. Detected by content type or a leading
 * HTML tag.
 */
import type { RawAnswer } from "../../bridge/thin-bridge-request";
import { BridgeAnswerRefusal } from "../../bridge/thin-bridge-request";

const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i;
const HTML_BODY_RE = /^\s*<(?:!doctype|html)\b/i;

export const SESSION_EXPIRED =
  "Session expired — open mytanita.eu, sign in, and retry";

export const looksLikeLoginPage = ({ contentType, body }: RawAnswer): boolean =>
  HTML_CONTENT_TYPE_RE.test(contentType) || HTML_BODY_RE.test(body);

export const readTanitaExport = (answer: RawAnswer): { csv: string } => {
  if (looksLikeLoginPage(answer)) {
    throw new BridgeAnswerRefusal(SESSION_EXPIRED, { needsReauth: true });
  }
  return { csv: answer.body };
};
