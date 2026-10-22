import { createFileRoute } from "@tanstack/react-router";
import scryptJs from "scrypt-js";
import bcrypt from "bcryptjs";
const { scrypt } = scryptJs;

// One-time move of every table and every login from the old database into
// Firebase. Protected by a server-only token; safe to re-run (idempotent).

const enc = new TextEncoder();

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    if (raw.length !== 48) return false;
    const key = raw.slice(0, 32);
    const salt = raw.slice(32);
    const calc = await scrypt(enc.encode(password), salt, 16384, 8, 1, 32);
    let diff = 0;
    for (let i = 0; i < 32; i++) diff |= key[i]! ^ calc[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/migrate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-migration-token") !== process.env["MIGRATION_TOKEN"]) {
          return Response.json({ error: "forbidden" }, { status: 403 });
        }
        const body = (await request.json().catch(() => ({}))) as { testPhone?: string; testPassword?: string; hashes?: { id: string; password_hash: string }[] };
        const admin = await import("@/lib/firebase-admin.server");
        const { FIREBASE_TABLES } = await import("@/lib/firebase-format");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const counts: Record<string, number> = {};
        const fsDb = await admin.fsDb();
        for (const table of FIREBASE_TABLES) {
          const rows: Record<string, unknown>[] = [];
          for (let from = 0; ; from += 1000) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabaseAdmin as any).from(table).select("*").range(from, from + 999);
            if (error) throw new Error(`${table}: ${error.message}`);
            rows.push(...(data ?? []));
            if (!data || data.length < 1000) break;
          }
          const docId = (r: Record<string, unknown>) => String(r["id"] ?? r["user_id"] ?? crypto.randomUUID());
          await admin.commitWrites(rows.map((r) => admin.wSet(fsDb, table, docId(r), r)));
          counts[table] = rows.length;
        }

        // Logins: copy each account with its existing password hash.
        let users = 0;
        let hashSample = "";
        for (let page = 1; ; page++) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
          if (error) throw new Error(`auth: ${error.message}`);
          const batch = data.users.map((u) => ({
            id: u.id,
            email: u.email ?? "",
            password_hash: (u as unknown as { encrypted_password?: string }).encrypted_password ?? "",
            full_name: String(u.user_metadata?.["full_name"] ?? ""),
            phone: String(u.user_metadata?.["phone"] ?? ""),
            created_at: u.created_at,
          }));
          if (batch[0]?.password_hash) hashSample = batch[0].password_hash;
          await admin.commitWrites(batch.map((u) => admin.wSet(fsDb, "auth_users", u.id, u)));
          users += batch.length;
          if (batch.length < 1000) break;
        }

        // Password hashes supplied directly (the admin API omits them).
        let hashesApplied = 0;
        if (Array.isArray(body.hashes)) {
          const writes = body.hashes
            .filter((h) => h.id && h.password_hash)
            .map((h) => admin.wUpdate(fsDb, "auth_users", h.id, { password_hash: h.password_hash }));
          await admin.commitWrites(writes);
          hashesApplied = writes.length;
        }

        let testLogin: boolean | null = null;
        if (body.testPhone && body.testPassword) {
          const authUsers = await admin.listCollection("auth_users");
          const found = authUsers.find((u) => u["email"] === `${body.testPhone!.replace(/\D/g, "")}@somiti.app`);
          testLogin = found ? await verifyPassword(body.testPassword, String(found["password_hash"] ?? "")) : false;
        }

        return Response.json({ tables: counts, users, hashCaptured: hashSample.length > 0, hashesApplied, testLogin });
      },
    },
  },
});
