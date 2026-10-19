import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminResetSchema, requireResetAdmin } from "./password-reset-schema";

export const resetAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(adminResetSchema)
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    requireResetAdmin(admin, error);
    if (data.userId === context.userId) throw new Error("নিজের পাসওয়ার্ড পরিবর্তনের ফর্ম ব্যবহার করুন");
    const profile = await context.supabase.from("profiles").select("id").eq("id", data.userId).single();
    if (profile.error || !profile.data) throw new Error("অ্যাকাউন্ট পাওয়া যায়নি");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (result.error) throw new Error("পাসওয়ার্ড রিসেট হয়নি। পাসওয়ার্ডের নিয়ম মেনে আবার চেষ্টা করুন");
    return { success: true };
  });