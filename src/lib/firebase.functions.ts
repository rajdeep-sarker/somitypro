import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FIREBASE_TABLES, MONEY_FIELDS, moneyTotals, toFirestoreFields } from "./firebase-format";

// Firestore mirror of the app database. Uses the Google service-account key
// via WebCrypto (workerd-safe) and the Firestore REST API.

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function firestore() {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("Firebase সেটআপ অসম্পূর্ণ");
  const sa = JSON.parse(raw) as { client_email: string; private_key: string; project_id: string };
  const now = Math.floor(Date.now() / 1000);
  const part = (o: unknown) => b64url(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ alg: "RS256", typ: "JWT" })}.${part({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${unsigned}.${b64url(sig)}`,
  });
  if (!res.ok) throw new Error(`Firebase লগইন ব্যর্থ [${res.status}]`);
  const token = ((await res.json()) as { access_token: string }).access_token;
  const db = `projects/${sa.project_id}/databases/(default)/documents`;
  const call = async (path: string, init?: RequestInit) => {
    const r = await fetch(`https://firestore.googleapis.com/v1/${path}`, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" } });
    if (!r.ok) throw new Error(`Firebase ত্রুটি [${r.status}]: ${(await r.text()).slice(0, 200)}`);
    return r.json() as Promise<Record<string, unknown>>;
  };
  return { db, call };
}

type Row = Record<string, unknown>;
const docId = (r: Row) => String(r["id"] ?? r["user_id"]);

async function writeRows(table: string, rows: Row[]) {
  const { db, call } = await firestore();
  for (let i = 0; i < rows.length; i += 400) {
    const writes = rows.slice(i, i + 400).map((r) => ({ update: { name: `${db}/${table}/${encodeURIComponent(docId(r))}`, fields: toFirestoreFields(r) } }));
    await call(`${db}:commit`, { method: "POST", body: JSON.stringify({ writes }) });
  }
}

async function readAll(table: string) {
  const { db, call } = await firestore();
  const out: Row[] = [];
  let pageToken = "";
  do {
    const j = await call(`${db}/${table}?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ""}`);
    for (const d of (j["documents"] as { fields: Record<string, Record<string, unknown>> }[] | undefined) ?? []) {
      const r: Row = {};
      for (const [k, v] of Object.entries(d.fields)) r[k] = v["integerValue"] !== undefined ? Number(v["integerValue"]) : (v["doubleValue"] ?? v["stringValue"] ?? v["booleanValue"] ?? null);
      out.push(r);
    }
    pageToken = (j["nextPageToken"] as string) ?? "";
  } while (pageToken);
  return out;
}

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("শুধু অ্যাডমিন এই কাজ করতে পারবেন");
}

async function loadTable(table: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await (supabaseAdmin as any).from(table).select("*").range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Copy every table to Firebase (admin only). Existing data here is untouched. */
export const syncAllToFirebase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    let total = 0;
    for (const t of FIREBASE_TABLES) { const rows = await loadTable(t); await writeRows(t, rows); total += rows.length; }
    return { total };
  });

/** Compare record counts and money totals on both sides (admin only). */
export const compareWithFirebase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const result = [];
    for (const t of FIREBASE_TABLES) {
      const [a, b] = await Promise.all([loadTable(t), readAll(t)]);
      result.push({ table: t, dbCount: a.length, fbCount: b.length, dbMoney: moneyTotals(a, MONEY_FIELDS), fbMoney: moneyTotals(b, MONEY_FIELDS) });
    }
    return result;
  });

/** Mirror one saved member to Firebase; reads through the caller's own permissions. */
export const mirrorMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("members").select("*").eq("id", data.id).single();
    if (error || !row) throw new Error("সদস্য পাওয়া যায়নি");
    await writeRows("members", [row as Row]);
    return { ok: true };
  });
