import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/LedgerPage";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/fund")({ head: () => pageHead("বীমা ও নিরাপত্তা তহবিল"), component: () => <LedgerPage module="fund"/> });
