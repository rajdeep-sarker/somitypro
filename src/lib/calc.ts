export type InstallmentType = "daily" | "weekly" | "monthly";

export const installmentLabels: Record<InstallmentType, string> = {
  daily: "দৈনিক",
  weekly: "সাপ্তাহিক",
  monthly: "মাসিক",
};

/** Flat-rate loan: total = principal + principal * rate%. Installment rounded up to whole taka. */
export function calcLoan(principal: number, ratePercent: number, count: number) {
  const interest = Math.round((principal * ratePercent) / 100);
  const total = principal + interest;
  const installment = Math.ceil(total / Math.max(1, count));
  return { interest, total, installment };
}

function toDate(s: string) {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addPeriods(start: string, type: InstallmentType, n: number): string {
  const d = toDate(start);
  if (type === "daily") d.setUTCDate(d.getUTCDate() + n);
  else if (type === "weekly") d.setUTCDate(d.getUTCDate() + 7 * n);
  else d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/** Number of installments whose due date is on or before `today` (capped at count). */
export function installmentsDue(firstDue: string, type: InstallmentType, count: number, today: string) {
  if (today < firstDue) return 0;
  let n = 0;
  while (n < count && addPeriods(firstDue, type, n) <= today) n++;
  return n;
}

export function isDueOn(firstDue: string, type: InstallmentType, count: number, day: string) {
  for (let i = 0; i < count; i++) {
    const d = addPeriods(firstDue, type, i);
    if (d === day) return true;
    if (d > day) return false;
  }
  return false;
}

export function loanStatus(
  loan: { first_due_date: string; installment_type: string; installment_count: number; installment_amount: number; total_payable: number },
  paid: number,
  today: string,
) {
  const type = loan.installment_type as InstallmentType;
  const dueCount = installmentsDue(loan.first_due_date, type, loan.installment_count, today);
  const expected = Math.min(loan.total_payable, dueCount * loan.installment_amount);
  const overdueAmount = Math.max(0, expected - paid);
  return {
    expected,
    remaining: Math.max(0, loan.total_payable - paid),
    overdueAmount,
    overdueInstallments: loan.installment_amount > 0 ? Math.ceil(overdueAmount / loan.installment_amount) : 0,
  };
}

/** Simple profit: amount * rate% * months/12 */
export function simpleProfit(amount: number, ratePercent: number, months: number) {
  return Math.round((amount * ratePercent * months) / 1200);
}

/** DPS: monthly deposit d for n months at r% yearly simple interest on running balance. */
export function dpsMaturity(deposit: number, ratePercent: number, months: number) {
  const principal = deposit * months;
  const profit = Math.round((deposit * ratePercent * months * (months + 1)) / 2 / 1200);
  return { principal, profit, total: principal + profit };
}
