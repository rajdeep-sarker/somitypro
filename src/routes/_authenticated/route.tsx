import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth } from "@/lib/app-client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
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
    return { user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
