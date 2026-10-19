import { describe, expect, it } from "vitest";
import { adminResetSchema, requireResetAdmin } from "./password-reset-schema";
describe("administrator-assisted reset", () => {
  it("rejects callers without verified admin privileges", () => {
    expect(() => requireResetAdmin(false, null)).toThrow();
    expect(() => requireResetAdmin(true, new Error("role lookup failed"))).toThrow();
    expect(() => requireResetAdmin(true, null)).not.toThrow();
  });
  it("requires an account ID and a valid new password", () => {
    expect(adminResetSchema.safeParse({ userId: "invalid", password: "example-password" }).success).toBe(false);
    expect(adminResetSchema.safeParse({ userId: "52e156fe-aeb2-477f-ac9f-ead0c1662d11", password: "short" }).success).toBe(false);
  });
});