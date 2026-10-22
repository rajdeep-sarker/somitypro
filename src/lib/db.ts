import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRow, insertRow, listRows, updateRow } from "./data.functions";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]["Row"];
export type Insert<T extends TableName> = Tables[T]["Insert"];

function sortRows<T extends TableName>(rows: Row<T>[], order: string, ascending: boolean): Row<T>[] {
  const dir = ascending ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = (a as Record<string, unknown>)[order];
    const y = (b as Record<string, unknown>)[order];
    const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return cmp * dir;
  });
}

export function rowQueryOptions<T extends TableName>(table: T, opts?: { order?: string; ascending?: boolean }) {
  return {
    queryKey: ["t", table],
    queryFn: async () => {
      const rows = (await listRows({ data: { table } })) as unknown as Row<T>[];
      const order = opts?.order ?? (table === "user_roles" || table === "somiti_settings" ? "id" : "created_at");
      return sortRows(rows, order, opts?.ascending ?? false).slice(0, 5000);
    },
  };
}

export function useRows<T extends TableName>(table: T, opts?: { order?: string; ascending?: boolean }) {
  return useQuery(rowQueryOptions(table, opts));
}

export function useInsert<T extends TableName>(table: T, success = "সফলভাবে সংরক্ষণ হয়েছে") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Insert<T> | Insert<T>[]) => {
      const list = Array.isArray(values) ? values : [values];
      for (const v of list) await insertRow({ data: { table, values: v as Record<string, unknown> } });
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
      await updateRow({ data: { table, id: String(id), values: values as Record<string, unknown> } });
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
      await deleteRow({ data: { table, id } });
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
