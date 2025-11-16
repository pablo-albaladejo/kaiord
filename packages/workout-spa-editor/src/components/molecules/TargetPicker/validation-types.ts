import type { Target } from "../../../types/krd";

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  target?: Target;
};
