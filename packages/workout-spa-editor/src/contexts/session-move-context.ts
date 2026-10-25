/**
 * The calendar's shared move flow, provided by `SessionMoveProvider`
 * (design §3.8). `null` outside it: an entry point without the flow offers
 * no move at all rather than one that skips the same-sport check.
 */
import { createContext, useContext } from "react";

export type RequestMove = (workoutId: string, targetDay: string) => void;

export const SessionMoveContext = createContext<RequestMove | null>(null);

export const useRequestMove = (): RequestMove | null =>
  useContext(SessionMoveContext);
