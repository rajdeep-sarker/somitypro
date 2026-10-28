import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import scryptJs from "scrypt-js";
import bcrypt from "bcryptjs";
const { scrypt } = scryptJs;
import { requireAppAuth } from "./auth-middleware";
import { phoneToEmail } from "./format";

// Password hashing matches the previous database (scrypt N=16384 r=8 p=1,
// base64 of key‖salt) so every existing password keeps working after the move.

const enc = new TextEncoder();
const SCRYPT = { N: 16384, r: 8, p: 1, dkLen: 32 } as const;
const b64 = (buf: Uint8Array) => btoa(String.fromCharCode(...buf));

async function hashPassword(password: string, salt?: Uint8Array): Promise<string> {
  const useSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await scrypt(enc.encode(password), useSalt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.dkLen);
  const out = new Uint8Array(key.length + useSalt.length);
  out.set(key);
  out.set(useSalt, key.length);
  return b64(out);
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    // Legacy logins were hashed with bcrypt; new ones use scrypt.
    if (stored.startsWith("$2")) return bcrypt.compareSync(password, stored);
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    if (raw.length !== SCRYPT.dkLen + 16) return false;
    const key = raw.slice(0, SCRYPT.dkLen);
    const salt = raw.slice(SCRYPT.dkLen);
    const calc = await scrypt(enc.encode(password), salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.dkLen);
    let diff = 0;
    for (let i = 0; i < key.length; i++) diff |= key[i]! ^ calc[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}

async function db() {
  const admin = await import("./firebase-admin.server");
  return admin;
}

async function findAuthUser(email: string) {
  const admin = await db();
  const users = await admin.listCollection("auth_users");
  return users.find((u) => u["email"] === email) ?? null;
}

async function isAdmin(userId: string): Promise<boolean> {
  const admin = await db();
  const roles = await admin.listCollection("user_roles");
  return roles.some((r) => r["user_id"] === userId && r["role"] === "admin");
}

async function issueToken(user: Record<string, unknown>) {
  const { signSession } = await import("./session.server");
  const token = await signSession(
    { uid: String(user["id"]), email: String(user["email"] ?? ""), name: String(user["full_name"] ?? "") },
    process.env["SESSION_SECRET"] ?? "",
  );
  return {
    token,
    user: { id: String(user["id"]), email: String(user["email"] ?? ""), full_name: String(user["full_name"] ?? ""), phone: String(user["phone"] ?? "") },
  };
}

export const renewSession = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .handler(async ({ context }) => {
    const { signSession } = await import("./session.server");
    const token = await signSession({ uid: context.userId, email: context.userEmail, name: context.userName }, process.env["SESSION_SECRET"] ?? "");
    return { token };
  });

export const loginWithPhone = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().min(11), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await findAuthUser(phoneToEmail(data.phone));
    if (!user || !(await verifyPassword(data.password, String(user["password_hash"] ?? "")))) {
      throw new Error("মোবাইল নম্বর বা পাসওয়ার্ড ভুল");
    }
    return issueToken(user);
  });

export const signUpAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ phone: z.string().regex(/^01\d{9}$/), password: z.string().min(6).max(128), name: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const email = phoneToEmail(data.phone);
    if (await findAuthUser(email)) throw new Error("এই নম্বরে অ্যাকাউন্ট আছে — লগইন করুন");
    const admin = await db();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const user = { id, email, password_hash: await hashPassword(data.password), full_name: data.name, phone: data.phone, created_at: now };
    const fsDb = await admin.fsDb();
    await admin.commitWrites([
      admin.wSet(fsDb, "auth_users", id, user),
      admin.wSet(fsDb, "profiles", id, { id, full_name: data.name, phone: data.phone, created_at: now }),
    ]);
    return issueToken(user);
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator(z.object({ current: z.string().min(1), next: z.string().min(6).max(128) }))
  .handler(async ({ data, context }) => {
    const admin = await db();
    const user = await admin.getDocument("auth_users", context.userId);
    if (!user || !(await verifyPassword(data.current, String(user["password_hash"] ?? "")))) {
      throw new Error("বর্তমান পাসওয়ার্ড ভুল");
    }
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wUpdate(fsDb, "auth_users", context.userId, { password_hash: await hashPassword(data.next) })]);
    return { ok: true };
  });

export const resetAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), password: z.string().min(8).max(128) }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("শুধু অ্যাডমিন পাসওয়ার্ড রিসেট করতে পারবেন");
    if (data.userId === context.userId) throw new Error("নিজের পাসওয়ার্ড পরিবর্তনের ফর্ম ব্যবহার করুন");
    const admin = await db();
    const user = await admin.getDocument("auth_users", data.userId);
    if (!user) throw new Error("অ্যাকাউন্ট পাওয়া যায়নি");
    const fsDb = await admin.fsDb();
    await admin.commitWrites([admin.wUpdate(fsDb, "auth_users", data.userId, { password_hash: await hashPassword(data.password) })]);
    return { success: true };
  });

export const createStaffLogin = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .inputValidator(z.object({ staffId: z.string().uuid(), phone: z.string().regex(/^01\d{9}$/), password: z.string().min(8).max(128) }))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.userId))) throw new Error("শুধু প্রশাসক কর্মীর লগইন তৈরি করতে পারবেন");
    const admin = await db();
    const staff = await admin.getDocument("staff", data.staffId);
    if (!staff || staff["user_id"]) throw new Error("কর্মীর তথ্য সঠিক নয় অথবা লগইন ইতিমধ্যে আছে");
    const email = phoneToEmail(data.phone);
    if (await findAuthUser(email)) throw new Error("লগইন তৈরি হয়নি। নম্বরটি আগে ব্যবহার হয়েছে কি না দেখুন।");
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const fsDb = await admin.fsDb();
    await admin.commitWrites([
      admin.wSet(fsDb, "auth_users", userId, { id: userId, email, password_hash: await hashPassword(data.password), full_name: String(staff["name"] ?? ""), phone: data.phone, created_at: now }),
      admin.wSet(fsDb, "profiles", userId, { id: userId, full_name: String(staff["name"] ?? ""), phone: data.phone, created_at: now }),
      admin.wSet(fsDb, "user_roles", crypto.randomUUID(), { user_id: userId, role: "staff" }),
      admin.wUpdate(fsDb, "staff", data.staffId, { user_id: userId, phone: data.phone }),
    ]);
    return { userId };
  });
