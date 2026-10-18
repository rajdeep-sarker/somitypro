import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/LedgerPage";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/banks")({ head: () => pageHead("ব্যাংক হিসাব"), component: () => <LedgerPage module="banks"/> });
