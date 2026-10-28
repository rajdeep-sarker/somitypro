import { interfaceLanguage } from "./ui-translation";
const nf = () => new Intl.NumberFormat(interfaceLanguage() === "en" ? "en-GB" : "bn-BD", { maximumFractionDigits: 2 });

export const bn = (n: number | string | null | undefined) => nf().format(Number(n ?? 0));
export const taka = (n: number | string | null | undefined) => `৳ ${nf().format(Number(n ?? 0))}`;

export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const bnDate = (s?: string | null) =>
  s ? new Intl.DateTimeFormat(interfaceLanguage() === "en" ? "en-GB" : "bn-BD", { day: "numeric", month: "long", year: "numeric" }).format(new Date(s)) : "—";

export const phoneToEmail = (phone: string) => `${phone.replace(/\D/g, "")}@somiti.app`;

export const sum = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((a, r) => a + (Number(f(r)) || 0), 0);
