import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";
import { announcementAudience } from "./announcement-audience";

// CTO banner: one active announcement, shown to each user for their next N
// app visits. Views are counted per user in "announcement_views".
async function load(userId: string) {
  const admin = await import("./firebase-admin.server");
  const roles = await admin.listCollection("user_roles");
  const cto = roles.some((r) => r["user_id"] === userId && r["role"] === "cto");
  return { admin, cto };
}

export const getAnnouncement = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, cto } = await load(context.userId);
    if (!cto) throw new Error("শুধু CTO");
    const rows = await admin.listCollection("announcements");
    const a = rows.find((r) => r["active"] === true);
    return a ? { id: String(a["id"]), title: String(a["title"] ?? ""), message: String(a["message"] ?? ""), shows: Number(a["shows"] ?? 1) } : null;
  });

export const getAnnouncementAudience = createServerFn({ method: "GET" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, cto } = await load(context.userId);
    if (!cto) throw new Error("শুধু CTO / CTO only");
    const [banners, views, profiles, roles] = await Promise.all([
      admin.listCollection("announcements"), admin.listCollection("announcement_views"),
      admin.listCollection("profiles"), admin.listCollection("user_roles"),
    ]);
    return banners.map((b) => ({ id: String(b["id"]), title: String(b["title"] ?? ""), active: b["active"] === true, createdAt: String(b["created_at"] ?? ""), viewers: announcementAudience(cto, String(b["id"]), views, profiles, roles) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

export const saveAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ title: z.string().trim().min(1).max(150), message: z.string().trim().min(1).max(2000), shows: z.number().int().min(1).max(50) }))
  .handler(async ({ data, context }) => {
    const { admin, cto } = await load(context.userId);
    if (!cto) throw new Error("শুধু CTO");
    const fsDb = await admin.fsDb();
    const old = (await admin.listCollection("announcements")).filter((r) => r["active"] === true);
    const id = crypto.randomUUID();
    await admin.commitWrites([
      ...old.map((r) => admin.wUpdate(fsDb, "announcements", String(r["id"]), { active: false })),
      admin.wSet(fsDb, "announcements", id, { id, ...data, active: true, created_at: new Date().toISOString() }),
    ]);
    return { id };
  });

export const stopAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, cto } = await load(context.userId);
    if (!cto) throw new Error("শুধু CTO");
    const fsDb = await admin.fsDb();
    const old = (await admin.listCollection("announcements")).filter((r) => r["active"] === true);
    await admin.commitWrites(old.map((r) => admin.wUpdate(fsDb, "announcements", String(r["id"]), { active: false })));
    return { ok: true };
  });

/** Called once per app visit: returns the banner if this user still has views left, and counts the view. */
export const takeAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { admin, cto } = await load(context.userId);
    if (cto) return null;
    const a = (await admin.listCollection("announcements")).find((r) => r["active"] === true);
    if (!a) return null;
    const key = `${String(a["id"])}_${context.userId}`;
    const view = await admin.getDocument("announcement_views", key);
    const seen = Number(view?.["count"] ?? 0);
    if (seen >= Number(a["shows"] ?? 1)) return null;
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wSet(fsDb, "announcement_views", key, { id: key, announcement_id: String(a["id"]), user_id: context.userId, count: seen + 1, last_seen_at: new Date().toISOString() })]);
    return { title: String(a["title"] ?? ""), message: String(a["message"] ?? "") };
  });
