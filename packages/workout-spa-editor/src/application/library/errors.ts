/**
 * Library-layer error types.
 *
 * `TemplateNotFoundError` is thrown by use cases that take a
 * `templateId` argument when the target template no longer exists
 * (deleted between user action and use-case execution). Catchers
 * surface a "Template no longer exists" toast and abort cleanly.
 */

export class TemplateNotFoundError extends Error {
  override readonly name = "TemplateNotFoundError";
  readonly templateId: string;
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`);
    this.templateId = templateId;
  }
}
