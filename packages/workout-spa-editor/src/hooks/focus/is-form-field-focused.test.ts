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

  it("returns true when a text input inside the editor root is focused", () => {
    // Arrange
    const input = document.createElement("input");
    input.type = "text";
    const root = mountInRoot(input);
    input.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("returns true for a textarea", () => {
    // Arrange
    const ta = document.createElement("textarea");
    const root = mountInRoot(ta);
    ta.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("returns true for a select", () => {
    // Arrange
    const sel = document.createElement("select");
    const root = mountInRoot(sel);
    sel.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("returns true for a contentEditable element", () => {
    // Arrange — use setAttribute because jsdom's `contentEditable`
    // setter does not always mirror the attribute.
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    // Make the div focusable for jsdom.
    div.setAttribute("tabindex", "0");
    const root = mountInRoot(div);
    div.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(true);
  });

  it("returns false for an input type='checkbox'", () => {
    // Arrange
    const chk = document.createElement("input");
    chk.type = "checkbox";
    const root = mountInRoot(chk);
    chk.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });

  it("returns false when the focused input lives outside the editor root", () => {
    // Arrange — focused input on body, editor root is empty.
    const root = document.createElement("div");
    document.body.appendChild(root);
    const outside = document.createElement("input");
    outside.type = "text";
    document.body.appendChild(outside);
    outside.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });

  it("returns false when there is no editor root", () => {
    // Act + Assert
    expect(isFormFieldFocused(null)).toBe(false);
  });

  it("returns false for a button inside the editor root", () => {
    // Arrange
    const btn = document.createElement("button");
    const root = mountInRoot(btn);
    btn.focus();

    // Act + Assert
    expect(isFormFieldFocused(root)).toBe(false);
  });
});
