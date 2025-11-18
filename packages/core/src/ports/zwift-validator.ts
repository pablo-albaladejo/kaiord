export type ZwiftValidationError = {
  field: string;
  message: string;
};

export type ZwiftValidationResult = {
  valid: boolean;
  errors: Array<ZwiftValidationError>;
};

export type ZwiftValidator = (
  xmlString: string
) => Promise<ZwiftValidationResult>;
