type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: { platform?: string };
};

const platform = (() => {
  if (typeof navigator === "undefined") return "";
  const nav = navigator as NavigatorWithUserAgentData;
  return nav.userAgentData?.platform ?? navigator.platform ?? "";
})();

export const isMac = /mac/i.test(platform);

export const modifierSymbol = isMac ? "⌘" : "Ctrl+";
export const shiftSymbol = isMac ? "⇧" : "Shift+";
export const deleteSymbol = isMac ? "⌫" : "Del";
export const ariaModifier = isMac ? "Meta" : "Control";
