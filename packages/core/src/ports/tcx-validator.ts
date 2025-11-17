export type TcxValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
};

export type TcxValidator = (xmlString: string) => Promise<TcxValidationResult>;
