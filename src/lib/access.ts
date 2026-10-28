import { useQuery } from "@tanstack/react-query";
import { myAccess } from "./data.functions";
import type { Access } from "@/components/menu";

export const accessQueryOptions = {
  queryKey: ["auth", "access"],
  queryFn: async () => {
    const a = await myAccess();
    return { admin: a.admin, view: a.view, write: a.write };
  },
  staleTime: 60_000,
};

export function toAccess(a: { admin: boolean; view: string[] } | undefined): Access {
  return { admin: a?.admin ?? false, view: new Set(a?.view ?? []) };
}

export function useAccess() {
  const q = useQuery(accessQueryOptions);
  return { ...toAccess(q.data), ready: q.isSuccess, write: new Set(q.data?.write ?? []) };
}
