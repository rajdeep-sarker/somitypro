type Row = Record<string, unknown>;

/** Supports legacy view IDs while projecting only account identity and display metadata. */
export function announcementAudience(cto: boolean, announcementId: string, views: Row[], profiles: Row[], roles: Row[]) {
  if (!cto) throw new Error("শুধু CTO / CTO only");
  return views.filter((v) => v["announcement_id"] === announcementId || (!v["announcement_id"] && String(v["id"]).startsWith(`${announcementId}_`)))
    .filter((v) => Number(v["count"]) > 0)
    .map((v) => {
      const userId = String(v["user_id"] ?? String(v["id"]).slice(announcementId.length + 1));
      const profile = profiles.find((p) => p["id"] === userId);
      return { userId, name: String(profile?.["full_name"] ?? ""), phone: String(profile?.["phone"] ?? ""), role: roles.some((r) => r["user_id"] === userId && r["role"] === "admin") ? "admin" : "staff", count: Number(v["count"]), lastSeenAt: typeof v["last_seen_at"] === "string" ? v["last_seen_at"] : null };
    }).sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""));
}