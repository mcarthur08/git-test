import { describe, it, expect, beforeEach } from "vitest";
import {
  pad,
  iso,
  parseISO,
  daysBetween,
  plural,
  lsGet,
  lsSet,
  shade,
  readingURL,
  qpt,
  cleanName
} from "./util.js";

describe("dates", () => {
  it("pads to two digits", () => {
    expect(pad(5)).toBe("05");
    expect(pad(12)).toBe("12");
  });

  it("formats a local date as yyyy-mm-dd", () => {
    expect(iso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(iso(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("parses yyyy-mm-dd into a local date", () => {
    const d = parseISO("2026-10-22");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 22]);
  });

  it("rejects text that is not yyyy-mm-dd", () => {
    expect(parseISO("")).toBeNull();
    expect(parseISO(null)).toBeNull();
    expect(parseISO(undefined)).toBeNull();
    expect(parseISO("2026-1-5")).toBeNull();
    expect(parseISO("10/22/2026")).toBeNull();
  });

  it("round-trips through iso()", () => {
    expect(iso(parseISO("2024-02-29"))).toBe("2024-02-29");
  });

  it("rejects dates that do not exist", () => {
    expect(parseISO("2026-02-31")).toBeNull();
    expect(parseISO("2026-13-01")).toBeNull();
    expect(parseISO("2026-00-10")).toBeNull();
  });

  it("counts whole days between dates", () => {
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(1);
    expect(daysBetween(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBe(-1);
    expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(0);
    expect(daysBetween(new Date(2026, 0, 1), new Date(2027, 0, 1))).toBe(365);
  });

  it("ignores the time of day and daylight-saving shifts", () => {
    expect(daysBetween(new Date(2026, 2, 7, 23, 59), new Date(2026, 2, 9, 0, 1))).toBe(2);
    expect(daysBetween(new Date(2026, 9, 31, 12), new Date(2026, 10, 2, 12))).toBe(2);
  });
});

describe("plural", () => {
  it("only drops the s for exactly one", () => {
    expect(plural(1, "day")).toBe("1 day");
    expect(plural(0, "day")).toBe("0 days");
    expect(plural(2, "day")).toBe("2 days");
  });
});

describe("localStorage helpers", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips values", () => {
    lsSet("k", { a: [1, 2], b: "x" });
    expect(lsGet("k")).toEqual({ a: [1, 2], b: "x" });
  });

  it("returns null for a missing key", () => {
    expect(lsGet("nope")).toBeNull();
  });

  it("returns null when the stored text is not JSON", () => {
    localStorage.setItem("bad", "{oops");
    expect(lsGet("bad")).toBeNull();
  });

  it("does not throw when storage refuses the write", () => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
    try {
      expect(() => lsSet("k", 1)).not.toThrow();
    } finally {
      Storage.prototype.setItem = real;
    }
  });
});

describe("shade", () => {
  it("leaves a colour alone at 0", () => {
    expect(shade("#336699", 0)).toBe("#336699");
  });

  it("goes fully white at +1 and fully black at -1", () => {
    expect(shade("#336699", 1)).toBe("#ffffff");
    expect(shade("#336699", -1)).toBe("#000000");
  });

  it("moves part of the way for fractions", () => {
    expect(shade("#000000", 0.5)).toBe("#808080");
    expect(shade("#ffffff", -0.5)).toBe("#808080");
  });

  it("keeps each channel in range for out-of-range amounts", () => {
    expect(shade("#336699", 5)).toBe("#ffffff");
    expect(shade("#336699", -5)).toBe("#000000");
  });
});

describe("readingURL", () => {
  it("encodes the passage and version", () => {
    expect(readingURL("1 John 2–3; Jude", "KJV")).toBe(
      "https://www.biblegateway.com/passage/?search=1%20John%202%E2%80%933%3B%20Jude&version=KJV"
    );
  });
});

describe("qpt (quadratic curve point)", () => {
  const a = { x: 0, y: 0 };
  const c = { x: 10, y: 20 };
  const b = { x: 20, y: 0 };

  it("starts at a and ends at b", () => {
    expect(qpt(a, c, b, 0)).toEqual(a);
    expect(qpt(a, c, b, 1)).toEqual(b);
  });

  it("is pulled halfway toward the control point at t = 0.5", () => {
    expect(qpt(a, c, b, 0.5)).toEqual({ x: 10, y: 10 });
  });

  it("is a straight line when the control point is on the line", () => {
    const p = qpt({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }, 0.3);
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(3);
  });
});

describe("cleanName", () => {
  it("keeps letters, accents, apostrophes, dots, hyphens and spaces", () => {
    expect(cleanName("Zoë O'Neil-Smith Jr.")).toBe("Zoë O'Neil-Smith Jr.");
  });

  it("drops digits, symbols and emoji", () => {
    expect(cleanName("B0b<script>!! 🙂")).toBe("Bbscript");
  });

  it("collapses whitespace and trims", () => {
    expect(cleanName("  Mary    Ann  ")).toBe("Mary Ann");
  });

  it("caps the length at 20", () => {
    expect(cleanName("a".repeat(50))).toHaveLength(20);
  });

  it("copes with empty and non-string input", () => {
    expect(cleanName("")).toBe("");
    expect(cleanName(null)).toBe("");
    expect(cleanName(undefined)).toBe("");
    expect(cleanName(1234)).toBe("");
  });
});
