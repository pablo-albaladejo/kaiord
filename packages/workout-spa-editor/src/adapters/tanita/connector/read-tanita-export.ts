/**
 * Reading MyTANITA's raw answer to the export, which the Tanita Bridge
 * hands over unread. A 200 whose body is an HTML document, not CSV, is not
 * the export, but neither is it evidence that the Session ended: MyTANITA
 * signs a Session out with a redirect to its login page, which the extension
 * reports itself. So such a page is MyTANITA not answering. Detected by
 * content type or a leading HTML tag.
 */
import type { RawAnswer } from "../../bridge/thin-bridge-request";
import { bridgeAnswerRefusal } from "../../bridge/thin-bridge-request";

const HTML_CONTENT_TYPE_RE = /^\s*text\/html\b/i;
const HTML_BODY_RE = /^\s*<(?:!doctype|html)\b/i;

const NOT_THE_EXPORT = "MyTANITA answered a page in place of the export";

const isHtmlPage = ({ contentType, body }: RawAnswer): boolean =>
  HTML_CONTENT_TYPE_RE.test(contentType) || HTML_BODY_RE.test(body);

export const readTanitaExport = (answer: RawAnswer): { csv: string } => {
  if (isHtmlPage(answer)) throw bridgeAnswerRefusal(NOT_THE_EXPORT);
  return { csv: answer.body };
};
