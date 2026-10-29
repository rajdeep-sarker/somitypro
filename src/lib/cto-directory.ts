type DirectoryRow = Record<string, unknown>;

/** Public account fields only; never return login secrets or editable permissions. */
export function ctoDirectory(isAdmin: boolean, roles: DirectoryRow[], profiles: DirectoryRow[]) {
  if (!isAdmin) throw new Error("শুধু অ্যাডমিন / Admin only");
  const ids = [...new Set(roles.filter((r) => r.role === "cto").map((r) => String(r.user_id)))];
  return ids.map((id) => {
    const profile = profiles.find((p) => p.id === id);
    return { id, name: String(profile?.full_name ?? "CTO"), phone: String(profile?.phone ?? "") };
  });
}