import { useQuery } from "@tanstack/react-query";
import { myAccess } from "./data.functions";
import type { Access } from "@/components/menu";

export const accessQueryOptions = {
  queryKey: ["auth", "access"],
  queryFn: async () => {
    const a = await myAccess();
    return { admin: a.admin, cto: a.cto, view: a.view, write: a.write };
  },
  staleTime: 60_000,
};

export function toAccess(a: { admin: boolean; cto?: boolean; view: string[] } | undefined): Access {
  return { admin: a?.admin ?? false, cto: a?.cto ?? false, view: new Set(a?.view ?? []) };
}

export function useAccess() {
  const q = useQuery(accessQueryOptions);
  return { ...toAccess(q.data), ready: q.isSuccess, write: new Set(q.data?.write ?? []) };
}
