import { createServerFn } from "@tanstack/react-start";
import { requireAppAuth } from "./auth-middleware";
import { FIREBASE_TABLES } from "./firebase-format";
// TEMPORARY one-off reset; removed right after use.
export const wipeOnce = createServerFn({ method: "POST" }).middleware([requireAppAuth]).handler(async ({ context }) => {
  const admin = await import("./firebase-admin.server");
  const roles = await admin.listCollection("user_roles");
  if (!roles.some((r) => r["user_id"] === context.userId && r["role"] === "cto")) throw new Error("CTO only");
  const keepUsers = new Set(roles.filter((r) => r["role"] === "admin" || r["role"] === "cto").map((r) => String(r["user_id"])));
  const keep = new Set(["somiti_settings", "somiti_rules", "user_roles", "profiles"]);
  const fsDb = await admin.fsDb();
  const out: Record<string, number> = {};
  for (const t of [...FIREBASE_TABLES.filter((x) => !keep.has(x)), "change_requests", "counters"]) {
    const rows = await admin.listCollection(t);
    out[t] = rows.length;
    await admin.commitWrites(rows.map((r) => admin.wDelete(fsDb, t, String(r["id"]))));
  }
  for (const t of ["auth_users", "profiles"]) {
    const rows = (await admin.listCollection(t)).filter((r) => !keepUsers.has(String(r["id"])));
    out[t] = rows.length; await admin.commitWrites(rows.map((r) => admin.wDelete(fsDb, t, String(r["id"]))));
  }
  const rr = roles.filter((r) => !keepUsers.has(String(r["user_id"])));
  out["user_roles"] = rr.length; await admin.commitWrites(rr.map((r) => admin.wDelete(fsDb, "user_roles", String(r["id"]))));
  return out;
});
