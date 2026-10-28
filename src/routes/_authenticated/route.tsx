import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/app-client";
import { AppShell } from "@/components/AppShell";
import { accessQueryOptions, toAccess } from "@/lib/access";
import { canOpen } from "@/components/menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.fetchQuery({
      queryKey: ["auth", "verified-user"],
      queryFn: async () => {
        const { data, error } = await auth.getUser();
        if (error) throw redirect({ to: "/auth" });
        return data.user;
      },
      staleTime: 60_000,
      retry: false,
    });
    if (!user) throw redirect({ to: "/auth" });
    // Users only reach pages the administrator allowed; the server re-checks every write.
    const access = toAccess(await context.queryClient.ensureQueryData(accessQueryOptions));
    if (!canOpen(access, location.pathname)) throw redirect({ to: "/dashboard" });
    return { user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
