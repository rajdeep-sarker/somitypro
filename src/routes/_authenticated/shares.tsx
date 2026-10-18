import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/LedgerPage";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/shares")({ head: () => pageHead("শেয়ার ব্যবস্থাপনা"), component: () => <LedgerPage module="shares"/> });
