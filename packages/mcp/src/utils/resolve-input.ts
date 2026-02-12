import { readFileAsText } from "./file-io";

export const validateExclusiveInput = (
  inputFile: string | undefined,
  inputContent: string | undefined
): void => {
  if (inputFile === undefined && inputContent === undefined) {
    throw new Error("Provide either input_file or input_content");
  }
  if (inputFile && inputContent) {
    throw new Error("Provide only one of input_file or input_content");
  }
};

export const resolveTextInput = async (
  inputFile: string | undefined,
  inputContent: string | undefined
): Promise<string> => {
  validateExclusiveInput(inputFile, inputContent);
  if (inputFile) {
    return readFileAsText(inputFile);
  }
  if (inputContent === undefined) {
    throw new Error(
      "input_content is required when input_file is not provided"
    );
  }
  return inputContent;
};
