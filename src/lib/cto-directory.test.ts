import { describe, expect, it } from "vitest";
import { ctoDirectory } from "./cto-directory";

describe("admin CTO directory", () => {
  const roles = [{ user_id: "tech", role: "cto" }, { user_id: "staff", role: "staff" }];
  const profiles = [{ id: "tech", full_name: "Tech Manager", phone: "01700000000", password_hash: "private" }];
  it("shows the assigned CTO identity to admins without secrets", () => {
    expect(ctoDirectory(true, roles, profiles)).toEqual([{ id: "tech", name: "Tech Manager", phone: "01700000000" }]);
  });
  it("rejects non-administrators", () => {
    expect(() => ctoDirectory(false, roles, profiles)).toThrow("Admin only");
  });
});