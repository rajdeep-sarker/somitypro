import { z } from "zod";
export const adminResetSchema = z.object({ userId: z.string().uuid(), password: z.string().min(8).max(128) });
export function requireResetAdmin(admin: boolean | null, roleError: unknown) {
  if (roleError || admin !== true) throw new Error("শুধু অ্যাডমিন পাসওয়ার্ড রিসেট করতে পারবেন");
}