import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAppAuth } from "./auth-middleware";

// Somiti logo and print signatures. Images are small cleaned PNG data URLs
// produced in the browser, kept in one Firestore document.
export type SignatureSlot = { id: string; label: string; image: string };
export type Branding = { logo: string; signatures: SignatureSlot[] };

export const DEFAULT_SIGNATURES: SignatureSlot[] = [
  { id: "member", label: "সদস্যের স্বাক্ষর", image: "" },
  { id: "accountant", label: "হিসাবরক্ষক", image: "" },
  { id: "manager", label: "ব্যবস্থাপক / সভাপতি", image: "" },
];

async function read(): Promise<Branding> {
  const admin = await import("./firebase-admin.server");
  const doc = await admin.getDocument("branding", "main");
  let signatures = DEFAULT_SIGNATURES;
  try { if (doc?.["signatures"]) { const parsed = JSON.parse(String(doc["signatures"])) as SignatureSlot[]; if (parsed.length) signatures = parsed; } } catch { /* keep defaults */ }
  return { logo: String(doc?.["logo"] ?? ""), signatures };
}

/** Logo only — shown on the public sign-in page too. */
export const getPublicLogo = createServerFn({ method: "GET" }).handler(async () => (await read()).logo);

export const getBranding = createServerFn({ method: "GET" }).middleware([requireAppAuth]).handler(async () => read());

const image = z.string().max(700_000).refine((s) => s === "" || s.startsWith("data:image/png;base64,") || s.startsWith("data:image/jpeg;base64,"), "ছবি সঠিক নয়");

export const saveBranding = createServerFn({ method: "POST" })
  .middleware([requireAppAuth])
  .validator(z.object({ logo: image, signatures: z.array(z.object({ id: z.string().min(1).max(40), label: z.string().trim().min(1).max(60), image })).max(6) }))
  .handler(async ({ data, context }) => {
    const admin = await import("./firebase-admin.server");
    const roles = await admin.listCollection("user_roles");
    if (!roles.some((r) => r["user_id"] === context.userId && r["role"] === "admin")) throw new Error("শুধু অ্যাডমিন");
    const fsDb = await admin.fsDb();
    const { logWrite } = await import("./activity.server");
    await admin.commitWrites([
      admin.wSet(fsDb, "branding", "main", { id: "main", logo: data.logo, signatures: JSON.stringify(data.signatures) }),
      logWrite(fsDb, context, "update", "somiti_settings", "branding", ["logo", "signatures"]),
    ]);
    return { ok: true };
  });
