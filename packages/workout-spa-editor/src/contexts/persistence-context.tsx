import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import type { PersistencePort } from "../ports/persistence-port";

const PersistenceContext = createContext<PersistencePort | null>(null);

export const PersistenceProvider = ({
  persistence,
  children,
}: {
  persistence: PersistencePort;
  children: ReactNode;
}) => (
  <PersistenceContext.Provider value={persistence}>
    {children}
  </PersistenceContext.Provider>
);

export const usePersistence = (): PersistencePort => {
  const ctx = useContext(PersistenceContext);
  if (!ctx) {
    throw new Error("usePersistence must be used within PersistenceProvider");
  }
  return ctx;
};
