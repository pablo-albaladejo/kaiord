/**
 * Form-field guard unit tests (§7.3).
 */

import { afterEach, describe, expect, it } from "vitest";

import { isFormFieldFocused } from "./is-form-field-focused";

const mountInRoot = (el: HTMLElement) => {
  const root = document.createElement("div");
  document.body.appendChild(root);
  root.appendChild(el);
  return root;
};

describe("isFormFieldFocused", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should return true when a text input inside the editor root is focused", () => {
    // Arrange
    const input = document.createElement("input");
    input.type = "text";
    const root = mountInRoot(input);

    // Act
    input.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("should return true for a textarea", () => {
    // Arrange
    const ta = document.createElement("textarea");
    const root = mountInRoot(ta);

    // Act
    ta.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("should return true for a select", () => {
    // Arrange
    const sel = document.createElement("select");
    const root = mountInRoot(sel);

    // Act
    sel.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("should return true for a contentEditable element", () => {
    // Arrange
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    div.setAttribute("tabindex", "0");
    const root = mountInRoot(div);

    // Act
    div.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("returns false for an input type='checkbox'", () => {
    // Arrange
    const chk = document.createElement("input");
    chk.type = "checkbox";
    const root = mountInRoot(chk);

    // Act
    chk.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });

  it("should return false when the focused input lives outside the editor root", () => {
    // Arrange
    const root = document.createElement("div");
    document.body.appendChild(root);
    const outside = document.createElement("input");
    outside.type = "text";
    document.body.appendChild(outside);

    // Act
    outside.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });

  it("should return false when there is no editor root", () => {
    // Arrange

    // Act

    // Assert
    expect(isFormFieldFocused(null)).toBe(false);
  });

  it("should return false for a button inside the editor root", () => {
    // Arrange
    const btn = document.createElement("button");
    const root = mountInRoot(btn);

    // Act
    btn.focus();

    // Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });
});
