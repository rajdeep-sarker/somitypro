import { describe, expect, it } from "vitest";
import { inkAlpha } from "./image-clean";
describe("signature cleanup", () => {
  it("white paper becomes fully transparent", () => { expect(inkAlpha(255, 255, 255)).toBe(0); expect(inkAlpha(230, 228, 220)).toBe(0); });
  it("dark ink stays fully visible", () => { expect(inkAlpha(20, 30, 90)).toBe(255); });
});
