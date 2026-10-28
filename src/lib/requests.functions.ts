import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";

// Change-request workflow:
//   staff writes  -> "new"        (admin sees it)
//   admin forwards / writes -> "forwarded" (CTO sees it)
//   CTO answers  -> "implemented" | "declined" with a reply
//   admin may close a staff request without forwarding -> "closed"
type Role = "admin" | "cto" | "staff";

async function who(userId: string) {
  const admin = await import("./firebase-admin.server");
  const roles = await admin.listCollection("user_roles");
  const mine = roles.filter((r) => r["user_id"] === userId).map((r) => String(r["role"]));
  const role: Role = mine.includes("cto") ? "cto" : mine.includes("admin") ? "admin" : "staff";
  return { admin, role };
}

export const submitChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ title: z.string().trim().min(2).max(150), details: z.string().trim().min(5).max(4000) }))
  .handler(async ({ data, context }) => {
    const { admin, role } = await who(context.userId);
    if (role === "cto") throw new Error("CTO অনুরোধ পাঠান না");
    const user = await admin.getDocument("profiles", context.userId);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wSet(fsDb, "change_requests", id, {
      id, title: data.title, details: data.details, user_id: context.userId, from_role: role,
      user_name: String(user?.["full_name"] ?? ""), status: role === "admin" ? "forwarded" : "new",
      forwarded_at: role === "admin" ? now : null, reply: "", created_at: now,
    })]);
    return { id };
  });

export type ChangeRequest = { id: string; title: string; details: string; user_name: string; from_role: string; status: string; admin_note: string; reply: string; created_at: string };

export const listChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, role } = await who(context.userId);
    const rows = await admin.listCollection("change_requests");
    return rows
      .filter((r) => role === "admin" || (role === "cto" ? ["forwarded", "implemented", "declined"].includes(String(r["status"])) : r["user_id"] === context.userId))
      .map((r): ChangeRequest => ({
        id: String(r["id"]), title: String(r["title"] ?? ""), details: String(r["details"] ?? ""), user_name: String(r["user_name"] ?? ""),
        from_role: String(r["from_role"] ?? "admin"), status: r["status"] === "seen" ? "new" : String(r["status"] ?? "new"),
        admin_note: String(r["admin_note"] ?? ""), reply: String(r["reply"] ?? ""), created_at: String(r["created_at"] ?? ""),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });

/** Items waiting on this person: staff requests for the admin, forwarded ones for the CTO. */
export const countNewRequests = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, role } = await who(context.userId);
    if (role === "staff") return 0;
    const rows = await admin.listCollection("change_requests");
    const waiting = role === "admin" ? ["new", "seen"] : ["forwarded"];
    return rows.filter((r) => waiting.includes(String(r["status"]))).length;
  });

export const actOnRequest = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ id: z.string().min(1), action: z.enum(["forward", "close", "implemented", "declined"]), note: z.string().trim().max(2000).default("") }))
  .handler(async ({ data, context }) => {
    const { admin, role } = await who(context.userId);
    const row = await admin.getDocument("change_requests", data.id);
    if (!row) throw new Error("অনুরোধ পাওয়া যায়নি");
    const status = String(row["status"]);
    const now = new Date().toISOString();
    let values: Record<string, unknown>;
    if (data.action === "forward" || data.action === "close") {
      if (role !== "admin" || !["new", "seen"].includes(status)) throw new Error("এই কাজের অনুমতি নেই");
      values = data.action === "forward" ? { status: "forwarded", forwarded_at: now, admin_note: data.note } : { status: "closed", admin_note: data.note };
    } else {
      if (role !== "cto" || status === "new" || status === "seen" || status === "closed") throw new Error("এই কাজের অনুমতি নেই");
      if (data.action === "declined" && !data.note) throw new Error("কেন করা হয়নি তা লিখুন");
      values = { status: data.action, reply: data.note, answered_at: now };
    }
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wUpdate(fsDb, "change_requests", data.id, values)]);
    return { ok: true };
  });
