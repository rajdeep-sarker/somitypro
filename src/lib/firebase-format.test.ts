import { describe, expect, it } from "vitest";
import { moneyTotals, toFirestoreValue } from "./firebase-format";

describe("firebase mirror format", () => {
  it("sums money columns to paisa", () => {
    expect(moneyTotals([{ amount: 100.105 }, { amount: "50" }], ["amount", "paid"])).toEqual({ amount: 150.11 });
  });
  it("keeps whole taka as integers and decimals as doubles", () => {
    expect(toFirestoreValue(500)).toEqual({ integerValue: "500" });
    expect(toFirestoreValue(12.5)).toEqual({ doubleValue: 12.5 });
  });
});
