import { useEffect } from "react";

import { useGarminBridge } from "../contexts";

export const useGarminDetection = () => {
  const { detectExtension } = useGarminBridge();

  useEffect(() => {
    detectExtension();
  }, [detectExtension]);
};
