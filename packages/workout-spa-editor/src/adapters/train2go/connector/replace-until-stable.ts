// A single pass can re-form a match (stripping `<b>` from `<scr<b>ipt`
// yields `<script`), so repeat until the string stops changing.
export const replaceUntilStable = (
  text: string,
  pattern: RegExp,
  replacement: string
): string => {
  let current = text;
  let prev: string;
  do {
    prev = current;
    current = current.replace(pattern, replacement);
  } while (current !== prev);
  return current;
};
