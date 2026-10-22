import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "./session.server";

const SECRET = "test-secret-key-for-session-signing";

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ uid: "u-1", email: "01@somiti.app", name: "পরীক্ষা" }, SECRET);
    const payload = await verifySession(token, SECRET);
    expect(payload?.uid).toBe("u-1");
    expect(payload?.email).toBe("01@somiti.app");
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ uid: "u-1", email: "a@b.c", name: "x" }, SECRET);
    const tampered = `${token.slice(0, -2)}${token.endsWith("a") ? "b" : "a"}.`;
    expect(await verifySession(tampered, SECRET)).toBeNull();
    expect(await verifySession(token, "wrong-secret")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signSession({ uid: "u-1", email: "a@b.c", name: "x" }, SECRET, -10);
    expect(await verifySession(token, SECRET)).toBeNull();
  });
});
