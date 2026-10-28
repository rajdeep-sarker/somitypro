import { describe, expect, it } from "vitest";
import { canOpen, visibleSections } from "@/components/menu";

const staff = { admin: false, view: new Set(["savings"]) };

describe("user permissions", () => {
  it("staff never sees User Management even with permissions", () => {
    expect(canOpen({ admin: false, view: new Set(["staff", "settings"]) }, "/users")).toBe(false);
  });
  it("staff only gets the sections they were given", () => {
    expect(visibleSections(staff).map((s) => s.key)).toEqual(["savings"]);
    expect(canOpen(staff, "/loans")).toBe(false);
    expect(canOpen(staff, "/savings")).toBe(true);
  });
  it("admin can open everything", () => {
    expect(canOpen({ admin: true, view: new Set() }, "/users")).toBe(true);
  });
});

describe("CTO role", () => {
  const cto = { admin: false, cto: true, view: new Set<string>() };
  it("CTO only opens the requests page", () => {
    expect(canOpen(cto, "/requests")).toBe(true);
    expect(canOpen(cto, "/dashboard")).toBe(false);
    expect(canOpen(cto, "/users")).toBe(false);
    expect(visibleSections(cto)).toEqual([]);
  });
});
