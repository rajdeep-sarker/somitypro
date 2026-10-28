import { describe, expect, it } from "vitest";
import { canOpen, visibleSections, menuDestinations, shortcutDestination, modulesForRoute } from "@/components/menu";

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

describe("consolidated navigation", () => {
  it("shows each actual page once across all work groups", () => {
    const routes = visibleSections({ admin: true, view: new Set() }).flatMap((s) => s.items.map((m) => m.to));
    expect(routes.filter((to) => to === "/centers")).toHaveLength(1);
    expect(routes.filter((to) => to === "/members")).toHaveLength(1);
    expect(routes.filter((to) => to === "/reports")).toHaveLength(1);
    expect(new Set(routes).size).toBe(routes.length);
    expect(menuDestinations).toHaveLength(26);
  });
  it("keeps legacy reports and accounts permissions despite merging duplicate links", () => {
    expect(modulesForRoute("/reports")).toContain("accounts");
    expect(canOpen({ admin: false, view: new Set(["accounts"]) }, "/reports")).toBe(true);
    expect(canOpen({ admin: false, view: new Set(["staff"]) }, "/attendance")).toBe(true);
    expect(canOpen({ admin: false, view: new Set(["centers"]) }, "/members")).toBe(false);
  });
  it("preserves saved actions under their destination when labels change", () => {
    expect(shortcutDestination("নতুন কেন্দ্র তৈরি")).toBe("/centers");
    expect(shortcutDestination("সদস্য তৈরি")).toBe("/members");
    expect(shortcutDestination("/savings")).toBe("/savings");
  });
});
