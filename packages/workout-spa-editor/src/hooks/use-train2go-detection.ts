import { useEffect } from "react";

import { useTrain2GoStore } from "../store/train2go-store";

export const useTrain2GoDetection = () => {
  const detectExtension = useTrain2GoStore((s) => s.detectExtension);

  useEffect(() => {
    detectExtension();
  }, [detectExtension]);
};
