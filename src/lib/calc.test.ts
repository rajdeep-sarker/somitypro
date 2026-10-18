import { describe, expect, it } from "vitest";
import { addPeriods, calcLoan, dpsMaturity, installmentsDue, isDueOn, loanStatus } from "./calc";

describe("loan calculation", () => {
  it("flat interest 10% on 10,000 over 10 installments", () => {
    expect(calcLoan(10000, 10, 10)).toEqual({ interest: 1000, total: 11000, installment: 1100 });
  });
  it("weekly due dates", () => {
    expect(addPeriods("2026-01-01", "weekly", 2)).toBe("2026-01-15");
    expect(installmentsDue("2026-01-01", "weekly", 10, "2026-01-15")).toBe(3);
    expect(isDueOn("2026-01-01", "weekly", 10, "2026-01-08")).toBe(true);
    expect(isDueOn("2026-01-01", "weekly", 10, "2026-01-09")).toBe(false);
  });
  it("overdue when paid less than expected", () => {
    const loan = { first_due_date: "2026-01-01", installment_type: "weekly", installment_count: 10, installment_amount: 1100, total_payable: 11000 };
    const s = loanStatus(loan, 1100, "2026-01-15");
    expect(s.overdueAmount).toBe(2200);
    expect(s.overdueInstallments).toBe(2);
    expect(s.remaining).toBe(9900);
  });
});

describe("dps", () => {
  it("1000 monthly, 12 months, 10%", () => {
    expect(dpsMaturity(1000, 10, 12)).toEqual({ principal: 12000, profit: 650, total: 12650 });
  });
});
