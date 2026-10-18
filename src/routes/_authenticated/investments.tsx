import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/LedgerPage";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/investments")({ head: () => pageHead("বিনিয়োগ ও প্রকল্প"), component: () => <LedgerPage module="investments"/> });
