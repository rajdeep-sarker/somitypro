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

export const homeItem = i("হোম", "/dashboard", Home);

export const menuSections: MenuSection[] = [
  { label: "এরিয়া বা কেন্দ্র সেটআপ", icon: MapPinned, items: [
    i("শাখা / ব্রাঞ্চ তালিকা", "/centers", GitBranch),
    i("সকল কেন্দ্র / সমিতি", "/centers", Map),
    i("নতুন কেন্দ্র তৈরি", "/centers", MapPin),
  ] },
  { label: "সদস্য ব্যবস্থাপনা", icon: UserCog, items: [
    i("সদস্য তৈরি", "/members", UserPlus),
    i("সদস্য ইমপোর্ট (এক্সেল)", "/import", FileSpreadsheet),
    i("সকল সদস্যের তথ্য", "/members", IdCard),
    i("সদস্যের তালিকা", "/members", Users),
    i("সমিতি ফি কালেকশন", "/fees", Banknote),
    i("সকল সমিতি ফি কালেকশন", "/fees", ReceiptText),
    i("বিলম্ব চার্জ কালেকশন", "/fees", History),
    i("সার্ভিস চার্জ", "/fees", HandCoins),
  ] },
  { label: "সঞ্চয় ব্যবস্থাপনা", icon: PiggyBank, items: [
    i("সঞ্চয়ের কিস্তি কালেকশন", "/savings", HandCoins),
    i("সঞ্চয় সকল কিস্তি কালেকশন", "/savings", ListChecks),
    i("সঞ্চয় ব্যবস্থাপনা", "/savings", Vault),
    i("লাভ ক্যালকুলেটর", "/savings", Calculator),
    i("লভ্যাংশ সেট", "/savings", Percent),
  ] },
  { label: "লোন ব্যবস্থাপনা", icon: HandCoins, items: [
    i("লোন আবেদন", "/loans", FilePen),
    i("সকল লোন আবেদন", "/loans", ListChecks),
    i("সকল লোনের তথ্য", "/loans", FileText),
    i("লোন ব্যবস্থাপনা", "/loans", Shield),
    i("লোন ও সঞ্চয় কালেকশন", "/collection", Layers),
    i("লোন কালেকশন (Smart)", "/loans/collect", IdCard),
    i("লোন কিস্তি কালেকশন", "/loans/collect", RefreshCcw),
    i("লোন সকল কিস্তি কালেকশন", "/loans/collect", ReceiptText),
    i("আজকের লোন কিস্তির তারিখ", "/loans/due", CalendarDays),
    i("লোন ক্লোজ / বন্ধ", "/loans", Flag),
    i("লোন আবেদন ফর্ম", "/loans", FileSignature),
    i("লোন কিস্তির তারিখ", "/loans/due", CalendarCheck),
    i("মেয়াদোত্তীর্ণ লোন সদস্য", "/loans/due", AlertTriangle),
    i("দৈনিক কালেকশন শীট", "/collection", ClipboardList),
    i("বাল্ক কালেকশন এন্ট্রি", "/collection", Zap),
  ] },
  { label: "DPS ব্যবস্থাপনা", icon: CircleDollarSign, items: [
    i("DPS ক্যালকুলেটর", "/dps", Calculator),
    i("আজকের DPS কিস্তির তারিখ", "/dps", CalendarDays),
    i("DPS স্কিম তৈরি", "/dps", PlusCircle),
    i("সকল DPS স্কিম", "/dps", ListChecks),
    i("DPS স্কিম সেটিং", "/dps", Settings2),
    i("DPS কালেকশন (Smart)", "/dps", IdCard),
    i("DPS কালেকশন", "/dps", Banknote),
    i("সকল DPS কালেকশন", "/dps", ReceiptText),
    i("DPS ব্যবস্থাপনা", "/dps", Vault),
    i("DPS কালেকশন রিপোর্ট", "/reports", PieChart),
    i("DPS উত্তোলন রিপোর্ট", "/reports", Undo2),
    i("DPS লভ্যাংশ রিপোর্ট", "/reports", Coins),
    i("DPS সার্ভিস চার্জ রিপোর্ট", "/reports", Ban),
    i("DPS সদস্য লেনদেন রিপোর্ট", "/reports", BookUser),
  ] },
  { label: "FDR ব্যবস্থাপনা", icon: BadgeDollarSign, items: [
    i("FDR ক্যালকুলেটর", "/fdr", Calculator),
    i("FDR স্কিম তৈরি", "/fdr", FilePen),
    i("FDR সেটিং ও কালেকশন", "/fdr", CircleDollarSign),
    i("সকল FDR কালেকশন", "/fdr", ReceiptText),
    i("FDR মুনাফা প্রদান", "/fdr", HandCoins),
    i("FDR ব্যবস্থাপনা", "/fdr", Shield),
    i("FDR কালেকশন রিপোর্ট", "/reports", LineChart),
    i("FDR উত্তোলন রিপোর্ট", "/reports", Banknote),
    i("FDR জমা-উত্তোলন রিপোর্ট", "/reports", Scale),
    i("FDR প্রদত্ত লাভ রিপোর্ট", "/reports", Coins),
  ] },
  { label: "শেয়ার ব্যবস্থাপনা", icon: Sun, items: [
    i("শেয়ার তৈরি করুন", "/shares", Layers),
    i("শেয়ার ক্রয় / ইস্যু", "/shares", ShoppingCart),
    i("শেয়ার সমর্পণ / উত্তোলন", "/shares", LogOut),
    i("শেয়ার লভ্যাংশ বন্টন", "/shares", Coins),
    i("শেয়ারহোল্ডার তালিকা", "/shares", Contact),
    i("শেয়ার ব্যবস্থাপনা ড্যাশবোর্ড", "/shares", PieChart),
    i("শেয়ার লেনদেন বিবরণী", "/shares", FileText),
  ] },
  { label: "বিনিয়োগ ব্যবস্থাপনা", icon: Briefcase, items: [
    i("নতুন প্রকল্প এন্ট্রি", "/investments", PlusCircle),
    i("প্রকল্প কিস্তি / লাভ আদায়", "/investments", HandCoins),
    i("সকল আদায় তালিকা", "/investments", ReceiptText),
    i("মূলধন উত্তোলন", "/investments", Upload),
    i("বিনিয়োগ ব্যবস্থাপনা ড্যাশবোর্ড", "/investments", LineChart),
    i("বিনিয়োগ প্রতিবেদন", "/investments", FileText),
  ] },
  { label: "বীমা বা নিরাপত্তা তহবিল", icon: Umbrella, items: [
    i("তহবিল ড্যাশবোর্ড", "/fund", Gauge),
    i("বীমা জমা গ্রহণ", "/fund", HandCoins),
    i("ঋণ মওকুফ (তহবিল)", "/fund", HeartHandshake),
    i("বীমা লাভ-ক্ষতি রিপোর্ট", "/fund", PieChart),
    i("সকল বীমা লেনদেন", "/fund", ListChecks),
  ] },
  { label: "জমা খরচ ব্যবস্থাপনা", icon: BarChart3, items: [
    i("খরচের খাত ব্যবস্থাপনা", "/cash", Tag),
    i("অন্যান্য আয়-ব্যয় খাত", "/cash", Cog),
    i("নগদ জমার খাত", "/cash", Coins),
    i("বেতনের রিপোর্ট", "/staff", Sheet),
    i("প্রারম্ভিক ক্যাশ টাকা", "/cash", Wallet),
    i("খরচের রিপোর্ট", "/reports", FileBarChart),
  ] },
  { label: "ব্যাংক একাউন্ট", icon: Landmark, items: [
    i("ব্যাংক একাউন্ট তৈরী", "/banks", PlusCircle),
    i("ব্যাংক লেনদেন", "/banks", ArrowLeftRight),
    i("লেনদেন তালিকা ও এডিট", "/banks", ListChecks),
    i("ব্যাংক ব্যবস্থাপনা", "/banks", Building2),
  ] },
  { label: "সমিতির রিপোর্ট ব্যবস্থাপনা", icon: ClipboardCheck, items: [
    i("সার্ভিস চার্জ রিপোর্ট", "/reports", Target),
    i("দৈনিক কালেকশন রিপোর্ট", "/reports", CalendarCheck),
    i("দৈনিক লেনদেন রিপোর্ট", "/reports", BookOpen),
    i("দৈনিক প্রদান রিপোর্ট", "/reports", HandCoins),
    i("হাতে নগদ রিপোর্ট", "/cash", Wallet),
    i("সদস্য ব্যালেন্স রিপোর্ট", "/reports", Users),
    i("লভ্যাংশ রিপোর্ট", "/reports", Coins),
    i("কিস্তিভিত্তিক লভ্যাংশ রিপোর্ট", "/reports", PieChart),
    i("বিলম্ব চার্জ রিপোর্ট", "/reports", History),
    i("সমিতি ফি কালেকশন রিপোর্ট", "/reports", ReceiptText),
    i("ভর্তি ফি কালেকশন রিপোর্ট", "/reports", IdCard),
    i("আজকের প্রদানকৃত টাকা রিপোর্ট", "/reports", Calendar),
    i("আজকের কালেকশন এন্ট্রি রিপোর্ট", "/reports", CalendarCheck),
    i("আজকের লেনদেন এন্ট্রি রিপোর্ট", "/receipts", FileText),
  ] },
  { label: "সমিতির একাউন্টস রিপোর্ট", icon: Landmark, items: [
    i("কালেকশন বাকি রিপোর্ট", "/loans/due", AlertTriangle),
    i("সদস্যের লেনদেন রিপোর্ট", "/reports", UserCheck),
    i("সদস্যের ব্যালেন্স সীট", "/reports", Scale),
    i("তারিখভিত্তিক সেটেলমেন্ট রিপোর্ট", "/reports", CalendarDays),
    i("একাউন্টস সেটেলমেন্ট রিপোর্ট", "/reports", Handshake),
    i("সকল কালেকশন রিপোর্ট", "/reports", Layers),
    i("আজকের লেনদেনের রিপোর্ট", "/receipts", History),
    i("সমিতি সারসংক্ষেপ রিপোর্ট", "/reports", PieChart),
    i("লভ্যাংশ সারসংক্ষেপ রিপোর্ট", "/reports", Coins),
  ] },
  { label: "স্টাফ ব্যবস্থাপনা", icon: UsersRound, items: [
    i("স্টাফ পদবী তৈরি", "/staff", PlusCircle),
    i("স্টাফ নাম এন্ট্রি", "/staff", UserPlus),
    i("স্টাফ লগইন ও পাসওয়ার্ড", "/staff", KeyRound),
    i("স্টাফের পারমিশন", "/staff", CheckCircle2),
    i("স্টাফের তালিকা", "/staff", Contact),
    i("আইডি কার্ড তৈরি করুন", "/staff", IdCard),
    i("স্টাফের উপস্থিতি", "/staff", UserCheck),
    i("স্টাফের উপস্থিতি রিপোর্ট", "/staff", CalendarCheck),
  ] },
  { label: "নোটিফিকেশন গেট ওয়ে", icon: Radio, items: [
    i("এসএমএস সেটিং", "/notifications", MessageSquare),
    i("ইমেইল নোটিফিকেশন", "/notifications", Mail),
    i("এসএমএস ক্রয়", "/notifications", Coins),
  ] },
  { label: "সেটিং", icon: Settings, items: [
    i("সমিতি সেটিংস", "/settings", Settings2),
    i("সমিতির নীতিমালা", "/rules", BookMarked),
    i("ইউজার ও পারমিশন", "/staff", Users),
  ] },
];

// Unique destinations for background preloading.
export const menuDestinations = Array.from(new Set([homeItem.to, ...menuSections.flatMap((s) => s.items.map((m) => m.to))]));

const iconTones = ["text-chart-5", "text-success", "text-chart-2", "text-destructive", "text-primary"] as const;
export const iconTone = (index: number) => iconTones[index % iconTones.length]!;
