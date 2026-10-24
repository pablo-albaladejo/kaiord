const GROUP_BASE = 0xe000;

export const GROUP_TOKEN = /[\ue000-\uf8ff]/;

export const GROUP_TOKEN_G = /[\ue000-\uf8ff]/g;

export type MaskedText = { masked: string; groups: Array<string> };

// Each top-level "( … )" becomes one private-use character, so separators
// inside a group never split the text around it. Input is balanced.
export const maskGroups = (text: string): MaskedText => {
  const groups: Array<string> = [];
  let masked = "";
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) {
        masked += String.fromCharCode(GROUP_BASE + groups.length);
        groups.push(text.slice(start, i));
      }
    } else if (depth === 0) {
      masked += ch;
    }
  }
  return { masked, groups };
};

export const groupText = (token: string, groups: Array<string>): string =>
  groups[token.charCodeAt(0) - GROUP_BASE] ?? "";

export const isBalancedWithin = (text: string, maxDepth: number): boolean => {
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (depth < 0 || depth > maxDepth) return false;
  }
  return depth === 0;
};
