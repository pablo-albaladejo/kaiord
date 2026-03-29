const extractDeveloperFields = (
  message: Record<string, unknown>
): Array<Record<string, unknown>> => {
  const devFields: Array<Record<string, unknown>> = [];

  for (const [key, value] of Object.entries(message)) {
    if (key.startsWith("developer_") || key.includes("DeveloperField")) {
      devFields.push({
        fieldName: key,
        value,
      });
    }
  }

  return devFields;
};

export const extractFieldsFromMessageArray = (
  messages: unknown[]
): Array<Record<string, unknown>> => {
  const developerFields: Array<Record<string, unknown>> = [];
  for (const message of messages) {
    if (message && typeof message === "object") {
      const devFields = extractDeveloperFields(
        message as Record<string, unknown>
      );
      if (devFields.length > 0) {
        developerFields.push(...devFields);
      }
    }
  }
  return developerFields;
};
