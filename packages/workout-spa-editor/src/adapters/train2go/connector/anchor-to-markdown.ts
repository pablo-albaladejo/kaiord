import { replaceUntilStable } from "./replace-until-stable";

// `<a href="URL">label</a>` becomes `[label](URL)`; an anchor without
// `href` or with an empty label keeps only its plain-text label. The
// href is entity-decoded later by the shared pipeline.
export const anchorToMarkdown = (
  _match: string,
  attrs: string,
  inner: string
): string => {
  const href = attrs.match(/\bhref\s*=\s*"([^"]*)"/i)?.[1];
  const label = replaceUntilStable(inner, /<[^>]+>/g, "").trim();
  return href && label ? `[${label}](${href})` : label;
};
