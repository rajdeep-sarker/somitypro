import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Home, MapPinned, Users, PiggyBank, HandCoins, CalendarDays, ClipboardList, BadgeDollarSign, Briefcase, Umbrella, Wallet, Landmark, FileBarChart, ReceiptText, UsersRound, UserCheck, Settings, Settings2, BookMarked, History, MessageSquare, FileSpreadsheet, Banknote, ShieldCheck } from "lucide-react";

export type MenuItem = { to: NonNullable<LinkProps["to"]>; label: string; en: string; icon: LucideIcon };
export type MenuSection = { key: string; label: string; en: string; icon: LucideIcon; items: MenuItem[] };
const i = (label: string, en: string, to: MenuItem["to"], icon: LucideIcon): MenuItem => ({ label, en, to, icon });
export const homeItem = i("ড্যাশবোর্ড", "Dashboard", "/dashboard", Home);

// Display groups are independent of stored permission module keys.
export const menuSections: MenuSection[] = [
  { key: "members", label: "সদস্য ও কেন্দ্র", en: "Members & Centers", icon: Users, items: [
    i("কেন্দ্র সেটআপ", "Centers", "/centers", MapPinned),
    i("সদস্য তালিকা ও এন্ট্রি", "Members & Entry", "/members", Users),
    i("সদস্য আমদানি", "Import Members", "/import", FileSpreadsheet),
    i("সমিতি ফি", "Member Fees", "/fees", Banknote),
  ] },
  { key: "savings", label: "সঞ্চয় ও আমানত", en: "Savings & Deposits", icon: PiggyBank, items: [
    i("সঞ্চয় জমা ও উত্তোলন", "Savings", "/savings", PiggyBank),
    i("DPS হিসাব ও স্কিম", "DPS Accounts & Schemes", "/dps", CalendarDays),
    i("FDR হিসাব ও মুনাফা", "FDR Accounts & Profit", "/fdr", BadgeDollarSign),
  ] },
  { key: "loans", label: "ঋণ ও কালেকশন", en: "Loans & Collection", icon: HandCoins, items: [
    i("লোন ব্যবস্থাপনা", "Loan Management", "/loans", HandCoins),
    i("লোন কিস্তি কালেকশন", "Loan Collection", "/loans/collect", Banknote),
    i("কিস্তি ও বকেয়া", "Dues & Overdue", "/loans/due", CalendarDays),
    i("দৈনিক ও বাল্ক কালেকশন", "Daily & Bulk Collection", "/collection", ClipboardList),
  ] },
  { key: "accounts", label: "হিসাব ও তহবিল", en: "Accounts & Funds", icon: Wallet, items: [
    i("নগদ জমা ও খরচ", "Cash & Expenses", "/cash", Wallet),
    i("ব্যাংক হিসাব ও লেনদেন", "Bank Accounts & Transfers", "/banks", Landmark),
    i("শেয়ার ব্যবস্থাপনা", "Shares", "/shares", BadgeDollarSign),
    i("বিনিয়োগ ও প্রকল্প", "Investments & Projects", "/investments", Briefcase),
    i("নিরাপত্তা তহবিল", "Security Fund", "/fund", Umbrella),
  ] },
  { key: "reports", label: "রিপোর্ট ও রসিদ", en: "Reports & Receipts", icon: FileBarChart, items: [
    i("সমিতির রিপোর্ট", "Somiti Reports", "/reports", FileBarChart),
    i("লেনদেন রসিদ", "Transaction Receipts", "/receipts", ReceiptText),
  ] },
  { key: "staff", label: "কর্মী ও হাজিরা", en: "Staff & Attendance", icon: UsersRound, items: [
    i("কর্মী ও বেতন", "Staff & Salary", "/staff", UsersRound),
    i("হাজিরা দিন", "Take Attendance", "/attendance", UserCheck),
  ] },
  { key: "settings", label: "পরিচালনা ও সেটিংস", en: "Administration", icon: Settings, items: [
    i("SMS ও ইমেইল", "SMS & Email", "/notifications", MessageSquare),
    i("নিয়ম ও নীতিমালা", "Rules & Policies", "/rules", BookMarked),
    i("ইউজার ও অনুমতি", "Users & Permissions", "/users", ShieldCheck),
    i("সমিতি সেটিংস", "Somiti Settings", "/settings", Settings2),
    i("অ্যাক্টিভিটি লগ", "Activity Log", "/activity", History),
  ] },
];

// Existing permission identifiers remain stable when navigation is reorganized.
export const permissionSections = [
  { key: "centers", label: "এরিয়া বা কেন্দ্র সেটআপ", en: "Area / Center Setup", icon: Settings },
  { key: "members", label: "সদস্য ব্যবস্থাপনা", en: "Member Management", icon: Settings },
  { key: "savings", label: "সঞ্চয় ব্যবস্থাপনা", en: "Savings Management", icon: Settings },
  { key: "loans", label: "লোন ব্যবস্থাপনা", en: "Loan Management", icon: Settings },
  { key: "dps", label: "DPS ব্যবস্থাপনা", en: "DPS Management", icon: Settings },
  { key: "fdr", label: "FDR ব্যবস্থাপনা", en: "FDR Management", icon: Settings },
  { key: "shares", label: "শেয়ার ব্যবস্থাপনা", en: "Share Management", icon: Settings },
  { key: "investments", label: "বিনিয়োগ ব্যবস্থাপনা", en: "Investment Management", icon: Settings },
  { key: "fund", label: "বীমা বা নিরাপত্তা তহবিল", en: "Insurance / Security Fund", icon: Settings },
  { key: "cash", label: "জমা খরচ ব্যবস্থাপনা", en: "Income & Expense", icon: Settings },
  { key: "banks", label: "ব্যাংক একাউন্ট", en: "Bank Accounts", icon: Settings },
  { key: "reports", label: "সমিতির রিপোর্ট ব্যবস্থাপনা", en: "Somiti Reports", icon: Settings },
  { key: "accounts", label: "সমিতির একাউন্টস রিপোর্ট", en: "Accounts Reports", icon: Settings },
  { key: "staff", label: "স্টাফ ব্যবস্থাপনা", en: "Staff Management", icon: Settings },
  { key: "notifications", label: "নোটিফিকেশন গেট ওয়ে", en: "Notification Gateway", icon: Settings },
  { key: "settings", label: "সেটিং", en: "Settings", icon: Settings },
];
const routeModules: Record<string, string[]> = {
  "/centers": [
    "centers"
  ],
  "/members": [
    "members"
  ],
  "/import": [
    "members"
  ],
  "/fees": [
    "members"
  ],
  "/savings": [
    "savings"
  ],
  "/loans": [
    "loans"
  ],
  "/collection": [
    "loans"
  ],
  "/loans/collect": [
    "loans"
  ],
  "/loans/due": [
    "loans",
    "accounts"
  ],
  "/dps": [
    "dps"
  ],
  "/reports": [
    "dps",
    "fdr",
    "cash",
    "reports",
    "accounts"
  ],
  "/fdr": [
    "fdr"
  ],
  "/shares": [
    "shares"
  ],
  "/investments": [
    "investments"
  ],
  "/fund": [
    "fund"
  ],
  "/cash": [
    "cash",
    "reports"
  ],
  "/staff": [
    "cash",
    "staff"
  ],
  "/banks": [
    "banks"
  ],
  "/receipts": [
    "reports",
    "accounts"
  ],
  "/users": [
    "staff",
    "settings"
  ],
  "/attendance": [
    "staff"
  ],
  "/notifications": [
    "notifications"
  ],
  "/settings": [
    "settings"
  ],
  "/rules": [
    "settings"
  ],
  "/activity": [
    "settings"
  ]
};
export const ADMIN_ROUTES = new Set<string>(["/users", "/settings", "/import", "/activity"]);
export function modulesForRoute(path: string): string[] {
  return Array.from(new Set(Object.entries(routeModules).filter(([to]) => path === to || path.startsWith(to + "/")).flatMap(([, keys]) => keys)));
}
export type Access = { admin: boolean; cto?: boolean; view: Set<string> };
export function canOpen(access: Access, to: string): boolean {
  if (access.cto) return to === "/requests" || to === "/activity";
  if (access.admin || to === homeItem.to || to === "/requests") return true;
  if (ADMIN_ROUTES.has(to)) return false;
  return modulesForRoute(to).some((key) => access.view.has(key));
}
export function visibleSections(access: Access): MenuSection[] {
  if (access.cto) return [];
  return menuSections.map((section) => ({ ...section, items: section.items.filter((item) => canOpen(access, item.to)) })).filter((section) => section.items.length > 0);
}
export const menuDestinations = Array.from(new Set([homeItem.to, ...menuSections.flatMap((s) => s.items.map((m) => m.to))]));
const iconTones = ["text-chart-5", "text-success", "text-chart-2", "text-destructive", "text-primary"] as const;
export const iconTone = (index: number) => iconTones[index % iconTones.length] ?? iconTones[0];

// Preserve previously saved shortcuts/favorites when their display labels change.
const legacyDestinations: Record<string, string> = {
  "শাখা / ব্রাঞ্চ তালিকা": "/centers",
  "সকল কেন্দ্র / সমিতি": "/centers",
  "নতুন কেন্দ্র তৈরি": "/centers",
  "সদস্য তৈরি": "/members",
  "সদস্য ইমপোর্ট (এক্সেল)": "/import",
  "সকল সদস্যের তথ্য": "/members",
  "সদস্যের তালিকা": "/members",
  "সমিতি ফি কালেকশন": "/fees",
  "সকল সমিতি ফি কালেকশন": "/fees",
  "বিলম্ব চার্জ কালেকশন": "/fees",
  "সার্ভিস চার্জ": "/fees",
  "সঞ্চয়ের কিস্তি কালেকশন": "/savings",
  "সঞ্চয় সকল কিস্তি কালেকশন": "/savings",
  "সঞ্চয় ব্যবস্থাপনা": "/savings",
  "লাভ ক্যালকুলেটর": "/savings",
  "লভ্যাংশ সেট": "/savings",
  "লোন আবেদন": "/loans",
  "সকল লোন আবেদন": "/loans",
  "সকল লোনের তথ্য": "/loans",
  "লোন ব্যবস্থাপনা": "/loans",
  "লোন ও সঞ্চয় কালেকশন": "/collection",
  "লোন কালেকশন (Smart)": "/loans/collect",
  "লোন কিস্তি কালেকশন": "/loans/collect",
  "লোন সকল কিস্তি কালেকশন": "/loans/collect",
  "আজকের লোন কিস্তির তারিখ": "/loans/due",
  "লোন ক্লোজ / বন্ধ": "/loans",
  "লোন আবেদন ফর্ম": "/loans",
  "লোন কিস্তির তারিখ": "/loans/due",
  "মেয়াদোত্তীর্ণ লোন সদস্য": "/loans/due",
  "দৈনিক কালেকশন শীট": "/collection",
  "বাল্ক কালেকশন এন্ট্রি": "/collection",
  "DPS ক্যালকুলেটর": "/dps",
  "আজকের DPS কিস্তির তারিখ": "/dps",
  "DPS স্কিম তৈরি": "/dps",
  "সকল DPS স্কিম": "/dps",
  "DPS স্কিম সেটিং": "/dps",
  "DPS কালেকশন (Smart)": "/dps",
  "DPS কালেকশন": "/dps",
  "সকল DPS কালেকশন": "/dps",
  "DPS ব্যবস্থাপনা": "/dps",
  "DPS কালেকশন রিপোর্ট": "/reports",
  "DPS উত্তোলন রিপোর্ট": "/reports",
  "DPS লভ্যাংশ রিপোর্ট": "/reports",
  "DPS সার্ভিস চার্জ রিপোর্ট": "/reports",
  "DPS সদস্য লেনদেন রিপোর্ট": "/reports",
  "FDR ক্যালকুলেটর": "/fdr",
  "FDR স্কিম তৈরি": "/fdr",
  "FDR সেটিং ও কালেকশন": "/fdr",
  "সকল FDR কালেকশন": "/fdr",
  "FDR মুনাফা প্রদান": "/fdr",
  "FDR ব্যবস্থাপনা": "/fdr",
  "FDR কালেকশন রিপোর্ট": "/reports",
  "FDR উত্তোলন রিপোর্ট": "/reports",
  "FDR জমা-উত্তোলন রিপোর্ট": "/reports",
  "FDR প্রদত্ত লাভ রিপোর্ট": "/reports",
  "শেয়ার তৈরি করুন": "/shares",
  "শেয়ার ক্রয় / ইস্যু": "/shares",
  "শেয়ার সমর্পণ / উত্তোলন": "/shares",
  "শেয়ার লভ্যাংশ বন্টন": "/shares",
  "শেয়ারহোল্ডার তালিকা": "/shares",
  "শেয়ার ব্যবস্থাপনা ড্যাশবোর্ড": "/shares",
  "শেয়ার লেনদেন বিবরণী": "/shares",
  "নতুন প্রকল্প এন্ট্রি": "/investments",
  "প্রকল্প কিস্তি / লাভ আদায়": "/investments",
  "সকল আদায় তালিকা": "/investments",
  "মূলধন উত্তোলন": "/investments",
  "বিনিয়োগ ব্যবস্থাপনা ড্যাশবোর্ড": "/investments",
  "বিনিয়োগ প্রতিবেদন": "/investments",
  "তহবিল ড্যাশবোর্ড": "/fund",
  "বীমা জমা গ্রহণ": "/fund",
  "ঋণ মওকুফ (তহবিল)": "/fund",
  "বীমা লাভ-ক্ষতি রিপোর্ট": "/fund",
  "সকল বীমা লেনদেন": "/fund",
  "খরচের খাত ব্যবস্থাপনা": "/cash",
  "অন্যান্য আয়-ব্যয় খাত": "/cash",
  "নগদ জমার খাত": "/cash",
  "বেতনের রিপোর্ট": "/staff",
  "প্রারম্ভিক ক্যাশ টাকা": "/cash",
  "খরচের রিপোর্ট": "/reports",
  "ব্যাংক একাউন্ট তৈরী": "/banks",
  "ব্যাংক লেনদেন": "/banks",
  "লেনদেন তালিকা ও এডিট": "/banks",
  "ব্যাংক ব্যবস্থাপনা": "/banks",
  "সার্ভিস চার্জ রিপোর্ট": "/reports",
  "দৈনিক কালেকশন রিপোর্ট": "/reports",
  "দৈনিক লেনদেন রিপোর্ট": "/reports",
  "দৈনিক প্রদান রিপোর্ট": "/reports",
  "হাতে নগদ রিপোর্ট": "/cash",
  "সদস্য ব্যালেন্স রিপোর্ট": "/reports",
  "লভ্যাংশ রিপোর্ট": "/reports",
  "কিস্তিভিত্তিক লভ্যাংশ রিপোর্ট": "/reports",
  "বিলম্ব চার্জ রিপোর্ট": "/reports",
  "সমিতি ফি কালেকশন রিপোর্ট": "/reports",
  "ভর্তি ফি কালেকশন রিপোর্ট": "/reports",
  "আজকের প্রদানকৃত টাকা রিপোর্ট": "/reports",
  "আজকের কালেকশন এন্ট্রি রিপোর্ট": "/reports",
  "আজকের লেনদেন এন্ট্রি রিপোর্ট": "/receipts",
  "কালেকশন বাকি রিপোর্ট": "/loans/due",
  "সদস্যের লেনদেন রিপোর্ট": "/reports",
  "সদস্যের ব্যালেন্স সীট": "/reports",
  "তারিখভিত্তিক সেটেলমেন্ট রিপোর্ট": "/reports",
  "একাউন্টস সেটেলমেন্ট রিপোর্ট": "/reports",
  "সকল কালেকশন রিপোর্ট": "/reports",
  "আজকের লেনদেনের রিপোর্ট": "/receipts",
  "সমিতি সারসংক্ষেপ রিপোর্ট": "/reports",
  "লভ্যাংশ সারসংক্ষেপ রিপোর্ট": "/reports",
  "স্টাফ পদবী তৈরি": "/staff",
  "স্টাফ নাম এন্ট্রি": "/staff",
  "স্টাফ লগইন ও পাসওয়ার্ড": "/users",
  "স্টাফের পারমিশন": "/users",
  "স্টাফের তালিকা": "/staff",
  "আইডি কার্ড তৈরি করুন": "/staff",
  "হাজিরা দিন": "/attendance",
  "স্টাফের উপস্থিতি রিপোর্ট": "/staff",
  "এসএমএস সেটিং": "/notifications",
  "ইমেইল নোটিফিকেশন": "/notifications",
  "এসএমএস ক্রয়": "/notifications",
  "সমিতি সেটিংস": "/settings",
  "সমিতির নীতিমালা": "/rules",
  "ইউজার ম্যানেজমেন্ট": "/users",
  "অ্যাক্টিভিটি লগ": "/activity"
};
export function shortcutDestination(value: string): string { return legacyDestinations[value] ?? value; }
