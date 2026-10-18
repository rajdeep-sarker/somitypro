import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createStaffLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ staffId: z.string().uuid(), phone: z.string().regex(/^01\d{9}$/), password: z.string().min(8) }))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("শুধু প্রশাসক কর্মীর লগইন তৈরি করতে পারবেন");
    const { data: staff, error } = await context.supabase.from("staff").select("id,name,user_id").eq("id", data.staffId).single();
    if (error || !staff || staff.user_id) throw new Error("কর্মীর তথ্য সঠিক নয় অথবা লগইন ইতিমধ্যে আছে");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.auth.admin.createUser({ email: `${data.phone}@somiti.app`, password: data.password, email_confirm: true, user_metadata: { full_name: staff.name, phone: data.phone } });
    if (result.error || !result.data.user) throw new Error("লগইন তৈরি হয়নি। নম্বরটি আগে ব্যবহার হয়েছে কি না দেখুন।");
    const userId = result.data.user.id;
    const role = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "staff" });
    const link = role.error ? role : await supabaseAdmin.from("staff").update({ user_id: userId, phone: data.phone }).eq("id", staff.id);
    if (link.error) { await supabaseAdmin.auth.admin.deleteUser(userId); throw new Error("লগইন সংরক্ষণ হয়নি, আবার চেষ্টা করুন"); }
    return { userId };
  });