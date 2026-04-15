const platform =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigator as any).userAgentData?.platform ?? navigator.platform ?? "";

export const isMac = /mac/i.test(platform);

export const modifierSymbol = isMac ? "⌘" : "Ctrl+";
export const shiftSymbol = isMac ? "⇧" : "Shift+";
export const deleteSymbol = isMac ? "⌫" : "Del";
export const ariaModifier = isMac ? "Meta" : "Control";
