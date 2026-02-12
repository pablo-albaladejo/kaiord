import { useCallback, useState } from "react";

export function useLazyDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(initialOpen);
  const show = useCallback(() => {
    setMounted(true);
    setOpen(true);
  }, []);
  return { open, setOpen, mounted, show } as const;
}
