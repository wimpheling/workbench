import { describe, expect, it } from "vitest";
import { dimensions, mm, toMillimetres, type Dimensions } from "./units";

describe("canonical millimetre units", () => {
  it("converts centimetres and metres at the boundary", () => {
    expect(toMillimetres(12, "cm")).toBe(120);
    expect(toMillimetres(1.5, "m")).toBe(1500);
    expect(mm(42)).toBe(42);
  });

  it("creates dimensions in canonical millimetres", () => {
    const size: Dimensions = dimensions(30, 60, 100);
    expect(size).toEqual({ x: 30, y: 60, z: 100 });
  });
});
