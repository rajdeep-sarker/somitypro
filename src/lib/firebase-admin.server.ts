import { toFirestoreFields } from "./firebase-format";

// Server-only Firestore access via the Google service-account key
// (WebCrypto-signed JWT → OAuth token → Firestore REST). Workerd-safe.

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedToken: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
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
  cachedToken = { token, exp: Date.now() + 3_500_000 };
  return token;
}

export async function fsDb(): Promise<string> {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("Firebase সেটআপ অসম্পূর্ণ");
  const sa = JSON.parse(raw) as { project_id: string };
  return `projects/${sa.project_id}/databases/(default)/documents`;
}

export async function fsCall(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const token = await accessToken();
  const r = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  if (!r.ok) throw new Error(`Firebase ত্রুটি [${r.status}]: ${(await r.text()).slice(0, 200)}`);
  return r.json() as Promise<Record<string, unknown>>;
}

type Row = Record<string, unknown>;
type FsValue = Record<string, unknown>;

function fromFsValue(v: FsValue): unknown {
  if (v["integerValue"] !== undefined) return Number(v["integerValue"]);
  if (v["doubleValue"] !== undefined) return v["doubleValue"];
  if (v["stringValue"] !== undefined) return v["stringValue"];
  if (v["booleanValue"] !== undefined) return v["booleanValue"];
  if (v["nullValue"] !== undefined) return null;
  if (v["timestampValue"] !== undefined) return v["timestampValue"];
  if (v["arrayValue"] !== undefined) return ((v["arrayValue"] as { values?: FsValue[] }).values ?? []).map(fromFsValue);
  if (v["mapValue"] !== undefined) {
    const out: Row = {};
    for (const [k, x] of Object.entries((v["mapValue"] as { fields: Record<string, FsValue> }).fields)) out[k] = fromFsValue(x);
    return out;
  }
  return null;
}

export function docToRow(d: { name?: string; fields?: Record<string, FsValue> }): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(d.fields ?? {})) out[k] = fromFsValue(v);
  if (out["id"] === undefined && d.name) out["id"] = decodeURIComponent(d.name.split("/").pop() ?? "");
  return out;
}

export async function listCollection(table: string): Promise<Row[]> {
  const db = await fsDb();
  const out: Row[] = [];
  let pageToken = "";
  do {
    const j = await fsCall(`${db}/${table}?pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ""}`);
    for (const d of (j["documents"] as { fields: Record<string, FsValue> }[] | undefined) ?? []) out.push(docToRow(d));
    pageToken = (j["nextPageToken"] as string) ?? "";
  } while (pageToken);
  return out;
}

export async function getDocument(table: string, id: string): Promise<Row | null> {
  const db = await fsDb();
  const token = await accessToken();
  const r = await fetch(`https://firestore.googleapis.com/v1/${db}/${table}/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Firebase ত্রুটি [${r.status}]`);
  return docToRow((await r.json()) as { fields: Record<string, FsValue> });
}

export type Write =
  | { update: { name: string; fields: Record<string, FsValue> }; updateMask?: { fieldPaths: string[] } }
  | { delete: string };

export const wSet = (db: string, table: string, id: string, fields: Row): Write => ({
  update: { name: `${db}/${table}/${encodeURIComponent(id)}`, fields: toFirestoreFields(fields) },
});
export const wUpdate = (db: string, table: string, id: string, fields: Row): Write => ({
  update: { name: `${db}/${table}/${encodeURIComponent(id)}`, fields: toFirestoreFields(fields) },
  updateMask: { fieldPaths: Object.keys(fields) },
});
export const wDelete = (db: string, table: string, id: string): Write => ({ delete: `${db}/${table}/${encodeURIComponent(id)}` });

export async function commitWrites(writes: Write[]): Promise<void> {
  const db = await fsDb();
  for (let i = 0; i < writes.length; i += 400) {
    await fsCall(`${db}:commit`, { method: "POST", body: JSON.stringify({ writes: writes.slice(i, i + 400) }) });
  }
}

/** Atomic read-modify-write on a single counter document, with retry on contention. */
export async function nextCounter(key: string): Promise<number> {
  const db = await fsDb();
  const name = `${db}/counters/${key}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const begin = await fsCall(`${db}:runTransaction`, { method: "POST", body: JSON.stringify({ reads: [name] }) });
    const txn = begin["transaction"] as string;
    const current = begin["document"] ? Number(docToRow(begin["document"] as { fields: Record<string, FsValue> })["value"] ?? 0) : 0;
    const next = current + 1;
    try {
      await fsCall(`${db}:runTransaction`, {
        method: "POST",
        body: JSON.stringify({ transaction: txn, writes: [{ update: { name, fields: toFirestoreFields({ value: next }) } }] }),
      });
      return next;
    } catch {
      // ABORTED on contention — retry with a fresh transaction.
    }
  }
  throw new Error("নম্বর বরাদ্দ হয়নি, আবার চেষ্টা করুন");
}
