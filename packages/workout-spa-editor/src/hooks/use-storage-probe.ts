import { useEffect } from "react";

import { storageStore } from "../store/storage-store";

export const useStorageProbe = () => {
  useEffect(() => {
    void storageStore.getState().probe();
  }, []);
};
