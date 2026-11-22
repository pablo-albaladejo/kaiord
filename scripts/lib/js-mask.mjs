// A JavaScript or TypeScript source with every comment, string, template
// and regular-expression body blanked to spaces, same length and same line
// breaks, so a pattern searched in the mask can only match code. Each string
// and template literal is listed with its offsets and raw body, so a caller
// can read the literal that sits at a position of the code.
//
// A `/` starts a regular expression when the code before it ends in an
// operator, an opening bracket or a keyword, and it closes on its line;
// otherwise it is a division (or the `</` of a JSX closing tag).

const REGEX_AFTER =
  /(?:^|[(,=:[!&|?{};+\-*%>~^]|\b(?:return|typeof|case|in|of|void|delete|throw|new|yield|await))\s*$/;

const blank = (text) => text.replace(/[^\n]/g, " ");

export const maskSource = (src) => {
  let code = "";
  const literals = [];
  const braces = [];
  let i = 0;
  const skipQuoted = (quote, start) => {
    let j = start + 1;
    while (j < src.length && src[j] !== quote) {
      if (src[j] === "\\") j++;
      else if (quote === "`" && src[j] === "$" && src[j + 1] === "{") break;
      else if (quote !== "`" && src[j] === "\n") break;
      j++;
    }
    return j;
  };
  const regexEnd = (start) => {
    let inClass = false;
    for (let j = start + 1; j < src.length && src[j] !== "\n"; j++) {
      if (src[j] === "\\") j++;
      else if (src[j] === "[") inClass = true;
      else if (src[j] === "]") inClass = false;
      else if (src[j] === "/" && !inClass) return j;
    }
    return 0;
  };
  // From `start` (an opening quote, or the `}` that resumes a template) to
  // the closing quote or the next `${`.
  const literal = (quote, start) => {
    const end = skipQuoted(quote, start);
    const body = src.slice(start + 1, end);
    const open = src[end] === "$";
    literals.push({
      start,
      end,
      quote,
      body,
      open,
      resumed: src[start] === "}",
    });
    code += (src[start] === "}" ? " " : quote) + blank(body);
    if (open) {
      braces.push(0);
      code += "${";
      return end + 2;
    }
    code += src[end] ?? "";
    return end + 1;
  };
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === "/" && next === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      code += blank(src.slice(i, stop));
      i = stop;
    } else if (ch === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      code += blank(src.slice(i, stop));
      i = stop;
    } else if (ch === '"' || ch === "'" || ch === "`") i = literal(ch, i);
    else if (ch === "}" && braces.length > 0 && braces.at(-1) === 0) {
      braces.pop();
      i = literal("`", i);
    } else if (ch === "/" && REGEX_AFTER.test(code.slice(-40)) && regexEnd(i)) {
      const j = regexEnd(i);
      code += `/${blank(src.slice(i + 1, j))}/`;
      i = j + 1;
    } else {
      if (braces.length > 0 && ch === "{") braces[braces.length - 1]++;
      if (braces.length > 0 && ch === "}") braces[braces.length - 1]--;
      code += ch;
      i++;
    }
  }
  return { code, literals };
};
