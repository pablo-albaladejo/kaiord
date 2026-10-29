import { readFileAsText } from "./file-io";

export const validateExclusiveInput = (
  inputFile: string | undefined,
  inputContent: string | undefined,
  [fileParam, contentParam] = ["input_file", "input_content"]
): void => {
  if (inputFile === undefined && inputContent === undefined) {
    throw new Error(`Provide either ${fileParam} or ${contentParam}`);
  }
  if (inputFile && inputContent) {
    throw new Error(`Provide only one of ${fileParam} or ${contentParam}`);
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
