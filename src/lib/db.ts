import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];

export function useRows<T extends TableName>(table: T, opts?: { order?: string; ascending?: boolean }) {
  return useQuery({
    queryKey: ["t", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(opts?.order ?? (table === "user_roles" || table === "somiti_settings" ? "id" : "created_at"), { ascending: opts?.ascending ?? false })
        .limit(5000);
      if (error) throw error;
      return data as unknown as Row<T>[];
    },
  });
}

export function useInsert<T extends TableName>(table: T, success = "সফলভাবে সংরক্ষণ হয়েছে") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Insert<T> | Insert<T>[]) => {
      const { error } = await supabase.from(table).insert(values as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["t", table] });
      toast.success(success);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdate<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string | number; values: Partial<Row<T>> }) => {
      const { error } = await supabase.from(table).update(values as never).eq("id" as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["t", table] });
      toast.success("আপডেট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDelete<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id" as never, id as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["t", table] });
      toast.success("মুছে ফেলা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function nextNo(prefix: string, existing: string[]) {
  const nums = existing.map((s) => Number(String(s).replace(/\D/g, "")) || 0);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}
