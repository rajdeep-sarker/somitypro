import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Home, MapPinned, GitBranch, Map, MapPin, UserCog, UserPlus, FileSpreadsheet, IdCard, Users, Banknote, ReceiptText, History, HandCoins,
  PiggyBank, ListChecks, Vault, Calculator, Percent, FilePen, FileText, Shield, Layers, RefreshCcw, CalendarDays, Flag, FileSignature,
  CalendarCheck, AlertTriangle, ClipboardList, Zap, CircleDollarSign, Settings2, PieChart, Undo2, Coins, Ban, BookUser, Sun, ShoppingCart,
  LogOut, BadgeDollarSign, Briefcase, PlusCircle, Upload, LineChart, Umbrella, Gauge, HeartHandshake, Wallet, Tag, Cog, Sheet,
  FileBarChart, CreditCard, Landmark, ArrowLeftRight, Building2, ClipboardCheck, Target, BookOpen, Scale, Calendar, Handshake,
  BarChart3, Radio, MessageSquare, Mail, Settings, BookMarked, UsersRound, KeyRound, CheckCircle2, Contact, UserCheck,
} from "lucide-react";

export type MenuItem = { to: NonNullable<LinkProps["to"]>; label: string; icon: LucideIcon };
export type MenuSection = { label: string; icon: LucideIcon; items: MenuItem[] };

const i = (label: string, to: MenuItem["to"], icon: LucideIcon): MenuItem => ({ label, to, icon });

export const homeItem = i("হোম", "Home", "/dashboard", Home);

export const menuSections: MenuSection[] = [
  { key: "centers", label: "এরিয়া বা কেন্দ্র সেটআপ", en: "Area / Center Setup", icon: MapPinned, items: [
    i("শাখা / ব্রাঞ্চ তালিকা", "Branch List", "/centers", GitBranch),
    i("সকল কেন্দ্র / সমিতি", "All Centers", "/centers", Map),
    i("নতুন কেন্দ্র তৈরি", "Create Center", "/centers", MapPin),
  ] },
  { key: "members", label: "সদস্য ব্যবস্থাপনা", en: "Member Management", icon: UserCog, items: [
    i("সদস্য তৈরি", "Add Member", "/members", UserPlus),
    i("সদস্য ইমপোর্ট (এক্সেল)", "Import Members (Excel)", "/import", FileSpreadsheet),
    i("সকল সদস্যের তথ্য", "All Member Details", "/members", IdCard),
    i("সদস্যের তালিকা", "Member List", "/members", Users),
    i("সমিতি ফি কালেকশন", "Somiti Fee Collection", "/fees", Banknote),
    i("সকল সমিতি ফি কালেকশন", "All Fee Collections", "/fees", ReceiptText),
    i("বিলম্ব চার্জ কালেকশন", "Late Fee Collection", "/fees", History),
    i("সার্ভিস চার্জ", "Service Charge", "/fees", HandCoins),
  ] },
  { key: "savings", label: "সঞ্চয় ব্যবস্থাপনা", en: "Savings Management", icon: PiggyBank, items: [
    i("সঞ্চয়ের কিস্তি কালেকশন", "Savings Installment", "/savings", HandCoins),
    i("সঞ্চয় সকল কিস্তি কালেকশন", "All Savings Collections", "/savings", ListChecks),
    i("সঞ্চয় ব্যবস্থাপনা", "Savings Management", "/savings", Vault),
    i("লাভ ক্যালকুলেটর", "Profit Calculator", "/savings", Calculator),
    i("লভ্যাংশ সেট", "Set Dividend", "/savings", Percent),
  ] },
  { key: "loans", label: "লোন ব্যবস্থাপনা", en: "Loan Management", icon: HandCoins, items: [
    i("লোন আবেদন", "Loan Application", "/loans", FilePen),
    i("সকল লোন আবেদন", "All Loan Applications", "/loans", ListChecks),
    i("সকল লোনের তথ্য", "All Loan Details", "/loans", FileText),
    i("লোন ব্যবস্থাপনা", "Loan Management", "/loans", Shield),
    i("লোন ও সঞ্চয় কালেকশন", "Loan & Savings Collection", "/collection", Layers),
    i("লোন কালেকশন (Smart)", "Loan Collection (Smart)", "/loans/collect", IdCard),
    i("লোন কিস্তি কালেকশন", "Loan Installment", "/loans/collect", RefreshCcw),
    i("লোন সকল কিস্তি কালেকশন", "All Loan Collections", "/loans/collect", ReceiptText),
    i("আজকের লোন কিস্তির তারিখ", "Today's Loan Dues", "/loans/due", CalendarDays),
    i("লোন ক্লোজ / বন্ধ", "Close Loan", "/loans", Flag),
    i("লোন আবেদন ফর্ম", "Loan Application Form", "/loans", FileSignature),
    i("লোন কিস্তির তারিখ", "Loan Due Dates", "/loans/due", CalendarCheck),
    i("মেয়াদোত্তীর্ণ লোন সদস্য", "Overdue Loan Members", "/loans/due", AlertTriangle),
    i("দৈনিক কালেকশন শীট", "Daily Collection Sheet", "/collection", ClipboardList),
    i("বাল্ক কালেকশন এন্ট্রি", "Bulk Collection Entry", "/collection", Zap),
  ] },
  { key: "dps", label: "DPS ব্যবস্থাপনা", en: "DPS Management", icon: CircleDollarSign, items: [
    i("DPS ক্যালকুলেটর", "DPS Calculator", "/dps", Calculator),
    i("আজকের DPS কিস্তির তারিখ", "Today's DPS Dues", "/dps", CalendarDays),
    i("DPS স্কিম তৈরি", "Create DPS Scheme", "/dps", PlusCircle),
    i("সকল DPS স্কিম", "All DPS Schemes", "/dps", ListChecks),
    i("DPS স্কিম সেটিং", "DPS Scheme Settings", "/dps", Settings2),
    i("DPS কালেকশন (Smart)", "DPS Collection (Smart)", "/dps", IdCard),
    i("DPS কালেকশন", "DPS Collection", "/dps", Banknote),
    i("সকল DPS কালেকশন", "All DPS Collections", "/dps", ReceiptText),
    i("DPS ব্যবস্থাপনা", "DPS Management", "/dps", Vault),
    i("DPS কালেকশন রিপোর্ট", "DPS Collection Report", "/reports", PieChart),
    i("DPS উত্তোলন রিপোর্ট", "DPS Withdrawal Report", "/reports", Undo2),
    i("DPS লভ্যাংশ রিপোর্ট", "DPS Dividend Report", "/reports", Coins),
    i("DPS সার্ভিস চার্জ রিপোর্ট", "DPS Service Charge Report", "/reports", Ban),
    i("DPS সদস্য লেনদেন রিপোর্ট", "DPS Member Transactions", "/reports", BookUser),
  ] },
  { key: "fdr", label: "FDR ব্যবস্থাপনা", en: "FDR Management", icon: BadgeDollarSign, items: [
    i("FDR ক্যালকুলেটর", "FDR Calculator", "/fdr", Calculator),
    i("FDR স্কিম তৈরি", "Create FDR Scheme", "/fdr", FilePen),
    i("FDR সেটিং ও কালেকশন", "FDR Settings & Collection", "/fdr", CircleDollarSign),
    i("সকল FDR কালেকশন", "All FDR Collections", "/fdr", ReceiptText),
    i("FDR মুনাফা প্রদান", "FDR Profit Payment", "/fdr", HandCoins),
    i("FDR ব্যবস্থাপনা", "FDR Management", "/fdr", Shield),
    i("FDR কালেকশন রিপোর্ট", "FDR Collection Report", "/reports", LineChart),
    i("FDR উত্তোলন রিপোর্ট", "FDR Withdrawal Report", "/reports", Banknote),
    i("FDR জমা-উত্তোলন রিপোর্ট", "FDR Deposit-Withdrawal Report", "/reports", Scale),
    i("FDR প্রদত্ত লাভ রিপোর্ট", "FDR Profit Paid Report", "/reports", Coins),
  ] },
  { key: "shares", label: "শেয়ার ব্যবস্থাপনা", en: "Share Management", icon: Sun, items: [
    i("শেয়ার তৈরি করুন", "Create Share", "/shares", Layers),
    i("শেয়ার ক্রয় / ইস্যু", "Share Purchase / Issue", "/shares", ShoppingCart),
    i("শেয়ার সমর্পণ / উত্তোলন", "Share Surrender", "/shares", LogOut),
    i("শেয়ার লভ্যাংশ বন্টন", "Share Dividend", "/shares", Coins),
    i("শেয়ারহোল্ডার তালিকা", "Shareholder List", "/shares", Contact),
    i("শেয়ার ব্যবস্থাপনা ড্যাশবোর্ড", "Share Dashboard", "/shares", PieChart),
    i("শেয়ার লেনদেন বিবরণী", "Share Statement", "/shares", FileText),
  ] },
  { key: "investments", label: "বিনিয়োগ ব্যবস্থাপনা", en: "Investment Management", icon: Briefcase, items: [
    i("নতুন প্রকল্প এন্ট্রি", "New Project", "/investments", PlusCircle),
    i("প্রকল্প কিস্তি / লাভ আদায়", "Project Collection", "/investments", HandCoins),
    i("সকল আদায় তালিকা", "All Collections", "/investments", ReceiptText),
    i("মূলধন উত্তোলন", "Capital Withdrawal", "/investments", Upload),
    i("বিনিয়োগ ব্যবস্থাপনা ড্যাশবোর্ড", "Investment Dashboard", "/investments", LineChart),
    i("বিনিয়োগ প্রতিবেদন", "Investment Report", "/investments", FileText),
  ] },
  { key: "fund", label: "বীমা বা নিরাপত্তা তহবিল", en: "Insurance / Security Fund", icon: Umbrella, items: [
    i("তহবিল ড্যাশবোর্ড", "Fund Dashboard", "/fund", Gauge),
    i("বীমা জমা গ্রহণ", "Insurance Deposit", "/fund", HandCoins),
    i("ঋণ মওকুফ (তহবিল)", "Loan Waiver (Fund)", "/fund", HeartHandshake),
    i("বীমা লাভ-ক্ষতি রিপোর্ট", "Insurance P&L Report", "/fund", PieChart),
    i("সকল বীমা লেনদেন", "All Insurance Transactions", "/fund", ListChecks),
  ] },
  { key: "cash", label: "জমা খরচ ব্যবস্থাপনা", en: "Income & Expense", icon: BarChart3, items: [
    i("খরচের খাত ব্যবস্থাপনা", "Expense Heads", "/cash", Tag),
    i("অন্যান্য আয়-ব্যয় খাত", "Other Income/Expense Heads", "/cash", Cog),
    i("নগদ জমার খাত", "Cash Deposit Heads", "/cash", Coins),
    i("বেতনের রিপোর্ট", "Salary Report", "/staff", Sheet),
    i("প্রারম্ভিক ক্যাশ টাকা", "Opening Cash", "/cash", Wallet),
    i("খরচের রিপোর্ট", "Expense Report", "/reports", FileBarChart),
  ] },
  { key: "banks", label: "ব্যাংক একাউন্ট", en: "Bank Accounts", icon: Landmark, items: [
    i("ব্যাংক একাউন্ট তৈরী", "Create Bank Account", "/banks", PlusCircle),
    i("ব্যাংক লেনদেন", "Bank Transaction", "/banks", ArrowLeftRight),
    i("লেনদেন তালিকা ও এডিট", "Transactions & Edit", "/banks", ListChecks),
    i("ব্যাংক ব্যবস্থাপনা", "Bank Management", "/banks", Building2),
  ] },
  { key: "reports", label: "সমিতির রিপোর্ট ব্যবস্থাপনা", en: "Somiti Reports", icon: ClipboardCheck, items: [
    i("সার্ভিস চার্জ রিপোর্ট", "Service Charge Report", "/reports", Target),
    i("দৈনিক কালেকশন রিপোর্ট", "Daily Collection Report", "/reports", CalendarCheck),
    i("দৈনিক লেনদেন রিপোর্ট", "Daily Transaction Report", "/reports", BookOpen),
    i("দৈনিক প্রদান রিপোর্ট", "Daily Payment Report", "/reports", HandCoins),
    i("হাতে নগদ রিপোর্ট", "Cash in Hand", "/cash", Wallet),
    i("সদস্য ব্যালেন্স রিপোর্ট", "Member Balance Report", "/reports", Users),
    i("লভ্যাংশ রিপোর্ট", "Dividend Report", "/reports", Coins),
    i("কিস্তিভিত্তিক লভ্যাংশ রিপোর্ট", "Installment Dividend Report", "/reports", PieChart),
    i("বিলম্ব চার্জ রিপোর্ট", "Late Fee Report", "/reports", History),
    i("সমিতি ফি কালেকশন রিপোর্ট", "Fee Collection Report", "/reports", ReceiptText),
    i("ভর্তি ফি কালেকশন রিপোর্ট", "Admission Fee Report", "/reports", IdCard),
    i("আজকের প্রদানকৃত টাকা রিপোর্ট", "Today's Payments", "/reports", Calendar),
    i("আজকের কালেকশন এন্ট্রি রিপোর্ট", "Today's Collections", "/reports", CalendarCheck),
    i("আজকের লেনদেন এন্ট্রি রিপোর্ট", "Today's Entries", "/receipts", FileText),
  ] },
  { key: "accounts", label: "সমিতির একাউন্টস রিপোর্ট", en: "Accounts Reports", icon: Landmark, items: [
    i("কালেকশন বাকি রিপোর্ট", "Collection Due Report", "/loans/due", AlertTriangle),
    i("সদস্যের লেনদেন রিপোর্ট", "Member Transactions", "/reports", UserCheck),
    i("সদস্যের ব্যালেন্স সীট", "Member Balance Sheet", "/reports", Scale),
    i("তারিখভিত্তিক সেটেলমেন্ট রিপোর্ট", "Date-wise Settlement", "/reports", CalendarDays),
    i("একাউন্টস সেটেলমেন্ট রিপোর্ট", "Accounts Settlement", "/reports", Handshake),
    i("সকল কালেকশন রিপোর্ট", "All Collections Report", "/reports", Layers),
    i("আজকের লেনদেনের রিপোর্ট", "Today's Transactions", "/receipts", History),
    i("সমিতি সারসংক্ষেপ রিপোর্ট", "Somiti Summary", "/reports", PieChart),
    i("লভ্যাংশ সারসংক্ষেপ রিপোর্ট", "Dividend Summary", "/reports", Coins),
  ] },
  { key: "staff", label: "স্টাফ ব্যবস্থাপনা", en: "Staff Management", icon: UsersRound, items: [
    i("স্টাফ পদবী তৈরি", "Staff Designations", "/staff", PlusCircle),
    i("স্টাফ নাম এন্ট্রি", "Add Staff", "/staff", UserPlus),
    i("স্টাফ লগইন ও পাসওয়ার্ড", "Staff Login & Password", "/staff", KeyRound),
    i("স্টাফের পারমিশন", "Staff Permissions", "/staff", CheckCircle2),
    i("স্টাফের তালিকা", "Staff List", "/staff", Contact),
    i("আইডি কার্ড তৈরি করুন", "ID Card", "/staff", IdCard),
    i("স্টাফের উপস্থিতি", "Staff Attendance", "/staff", UserCheck),
    i("স্টাফের উপস্থিতি রিপোর্ট", "Attendance Report", "/staff", CalendarCheck),
  ] },
  { key: "notifications", label: "নোটিফিকেশন গেট ওয়ে", en: "Notification Gateway", icon: Radio, items: [
    i("এসএমএস সেটিং", "SMS Settings", "/notifications", MessageSquare),
    i("ইমেইল নোটিফিকেশন", "Email Notification", "/notifications", Mail),
    i("এসএমএস ক্রয়", "Buy SMS", "/notifications", Coins),
  ] },
  { key: "settings", label: "সেটিং", en: "Settings", icon: Settings, items: [
    i("সমিতি সেটিংস", "Somiti Settings", "/settings", Settings2),
    i("সমিতির নীতিমালা", "Somiti Rules", "/rules", BookMarked),
    i("ইউজার ও পারমিশন", "Users & Permissions", "/staff", Users),
  ] },
];

// Unique destinations for background preloading.
export const menuDestinations = Array.from(new Set([homeItem.to, ...menuSections.flatMap((s) => s.items.map((m) => m.to))]));

const iconTones = ["text-chart-5", "text-success", "text-chart-2", "text-destructive", "text-primary"] as const;
export const iconTone = (index: number) => iconTones[index % iconTones.length]!;
