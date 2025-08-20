import { normalize, toBullets, toParagraphs } from "../utils/listingHelpers";

describe("normalize", () => {
  it("cleans CRLF and collapses extra lines", () => {
    const input = "Line1\r\n\r\n\r\nLine2\t";
    const expected = "Line1\n\nLine2";
    expect(normalize(input)).toBe(expected);
  });

  it("handles empty or falsy input", () => {
    expect(normalize("")).toBe("");
    expect(normalize(null)).toBe("");
  });
});

describe("toParagraphs", () => {
  it("joins bullet lines into sentences", () => {
    const input = "- first item\n- second item";
    const expected = "first item second item";
    expect(toParagraphs(input)).toBe(expected);
  });

  it("preserves paragraph spacing", () => {
    const input = "para1\n\n\npara2";
    const expected = "para1\n\npara2";
    expect(toParagraphs(input)).toBe(expected);
  });

  it("handles empty input", () => {
    expect(toParagraphs("")).toBe("");
  });
});

describe("toBullets", () => {
  it("creates bullets from sentences", () => {
    const input = "This is a somewhat longer sentence one that should split. This is sentence two that is also sufficiently long.";
    const expected = "- This is a somewhat longer sentence one that should split.\n- This is sentence two that is also sufficiently long.";
    expect(toBullets(input)).toBe(expected);
  });

  it("normalizes existing bullets", () => {
    const input = "• item one\nitem two";
    const expected = "• item one\n- item two";
    expect(toBullets(input)).toBe(expected);
  });

  it("handles empty input", () => {
    expect(toBullets("")).toBe("");
  });
});
