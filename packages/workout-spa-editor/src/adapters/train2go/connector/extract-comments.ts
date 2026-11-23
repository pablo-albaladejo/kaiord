import { decodeEntities } from "./decode-entities";
import { htmlFragmentToText } from "./html-fragment-text";
import type { Train2GoComment } from "./train2go-wire-types";

// Metadata (avatar, delete button on own comments) sits BEFORE the
// `</time>` close; the body sits AFTER it, up to the next `</div>`.
const parseCommentBlock = (block: string): Train2GoComment | null => {
  const dt = block.match(/<time[^>]*\bdatetime="([^"]*)"/);
  // `\s*` tolerates pretty-printed `</time\n>`.
  const close = block.match(/<\/time\s*>/);
  if (!dt || !close || close.index === undefined) return null;

  const head = block.slice(0, close.index);
  const author = head.match(/<picture[^>]*\btitle="([^"]*)"/)?.[1] ?? "";
  const isOwn = /data-remote="[^"]*\/api\/v2\/comments\/\d/.test(head);

  const afterTime = block.slice(close.index + close[0].length);
  const bodyEnd = afterTime.search(/<\/div\s*>/);
  const bodyHtml = bodyEnd >= 0 ? afterTime.slice(0, bodyEnd) : afterTime;

  return {
    author: decodeEntities(author),
    isOwn,
    timestamp: dt[1] ?? "",
    text: htmlFragmentToText(bodyHtml),
  };
};

export const extractComments = (html: unknown): Train2GoComment[] => {
  if (!html || typeof html !== "string") return [];
  // `class="comment"` (quote right after `comment`) matches a comment
  // wrapper but not the `class="comments "` container.
  const blocks = html.split(/<div class="comment"/);
  const comments: Train2GoComment[] = [];
  for (const block of blocks.slice(1)) {
    const comment = parseCommentBlock(block);
    if (comment) comments.push(comment);
  }
  return comments;
};
