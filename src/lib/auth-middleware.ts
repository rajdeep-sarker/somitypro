import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Verifies the app-issued session token (Firebase-backed auth) on server functions.
export const requireAppAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const header = getRequest().headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { verifySession } = await import("./session.server");
  const payload = token ? await verifySession(token, process.env["SESSION_SECRET"] ?? "") : null;
  if (!payload) throw new Error("সেশন শেষ হয়েছে — আবার লগইন করুন");
  return next({ context: { userId: payload.uid, userEmail: payload.email, userName: payload.name } });
});
