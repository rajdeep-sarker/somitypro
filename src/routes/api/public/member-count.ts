import { createFileRoute } from "@tanstack/react-router";

// Public stat for the landing page: how many members are registered right now.
// Raw JSON endpoint so the browser can read it without an app session.

export const Route = createFileRoute("/api/public/member-count")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const admin = await import("@/lib/firebase-admin.server");
          const members = await admin.listCollection("members");
          const count = members.filter((m) => String(m["status"] ?? "active") !== "inactive").length;
          return Response.json({ count });
        } catch {
          return Response.json({ count: null }, { status: 200 });
        }
      },
    },
  },
});
