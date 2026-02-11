import { readFileAsText } from "./file-io";

export const validateExclusiveInput = (
  inputFile: string | undefined,
  inputContent: string | undefined
): void => {
  if (!inputFile && !inputContent) {
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
  return inputContent!;
};
