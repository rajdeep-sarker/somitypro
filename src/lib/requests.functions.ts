import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";

// "Changes needed" requests from the administrator. Stored so nothing is lost
// before email delivery is set up.
async function requireAdmin(userId: string) {
  const admin = await import("./firebase-admin.server");
  const roles = await admin.listCollection("user_roles");
  if (!roles.some((r) => r["user_id"] === userId && r["role"] === "admin")) throw new Error("শুধু অ্যাডমিন");
  return admin;
}

export const submitChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator(z.object({ title: z.string().trim().min(2).max(150), details: z.string().trim().min(5).max(4000) }))
  .handler(async ({ data, context }) => {
    const admin = await requireAdmin(context.userId);
    const user = await admin.getDocument("profiles", context.userId);
    const id = crypto.randomUUID();
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wSet(fsDb, "change_requests", id, {
      id, title: data.title, details: data.details, user_id: context.userId,
      user_name: String(user?.["full_name"] ?? ""), phone: String(user?.["phone"] ?? ""), status: "new", created_at: new Date().toISOString(),
    })]);
    return { id };
  });

export const listChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const admin = await requireAdmin(context.userId);
    const rows = await admin.listCollection("change_requests");
    return rows
      .map((r) => ({ id: String(r["id"]), title: String(r["title"] ?? ""), details: String(r["details"] ?? ""), user_name: String(r["user_name"] ?? ""), created_at: String(r["created_at"] ?? "") }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
