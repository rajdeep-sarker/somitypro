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

import { SESSION_TTL_SECONDS, signSession as sign2 } from "./session.server";
import { it as it2, expect as expect2 } from "vitest";
it2("remembered login stays valid for a full year", async () => {
  expect2(SESSION_TTL_SECONDS).toBe(365 * 24 * 3600);
  const t = await sign2({ uid: "u", email: "e", name: "n" }, "s");
  const exp = JSON.parse(atob(t.split(".")[0]!.replace(/-/g, "+").replace(/_/g, "/"))).exp;
  expect2(exp * 1000 - Date.now()).toBeGreaterThan(364 * 24 * 3600 * 1000);
});
