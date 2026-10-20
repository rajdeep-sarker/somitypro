import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { brokeredPreviewStorage } from "@/integrations/supabase/previewAuthStorage";
import { createLoginStorage } from "./login-storage";

let client: ReturnType<typeof createClient<Database>> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop, receiver) {
    if (!client) {
      const url = import.meta.env["VITE_SUPABASE_URL"];
      const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) throw new Error("লগইন সেবা সংযুক্ত নেই");
      const persistent = brokeredPreviewStorage();
      client = createClient<Database>(url, key, {
        global: { fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        } },
        auth: { persistSession: true, autoRefreshToken: true,
          storage: typeof window !== "undefined" && persistent ? createLoginStorage(persistent, window.sessionStorage, window.localStorage) : undefined },
      });
    }
    return Reflect.get(client, prop, receiver);
  },
});