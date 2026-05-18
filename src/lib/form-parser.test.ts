import { describe, expect, it } from "vitest";

import { extractFormId, isValidGoogleFormUrl } from "./form-parser";

describe("form-parser (kept in sync with jac/form_parser.jac)", () => {
  it("extracts form id from a docs.google.com forms URL", () => {
    expect(
      extractFormId("https://docs.google.com/forms/d/e/ABC123/viewform"),
    ).toBe("ABC123");
  });

  it("accepts valid Google Forms hosts and paths", () => {
    expect(
      isValidGoogleFormUrl("https://docs.google.com/forms/d/e/x/viewform"),
    ).toBe(true);
    expect(isValidGoogleFormUrl("https://example.com")).toBe(false);
  });
});
