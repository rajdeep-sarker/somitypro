import { describe, expect, it } from "vitest";
import { validateMemberFile } from "./member-files";
describe("member documents", () => {
  it("accepts JPG PNG and PDF during member creation", () => {
    for (const [name, type] of [["photo.jpg", "image/jpeg"], ["photo.png", "image/png"], ["nid.pdf", "application/pdf"]]) {
      expect(() => validateMemberFile({ name: name ?? "", type: type ?? "", size: 100 })).not.toThrow();
    }
  });
  it("rejects files exceeding the existing ten megabyte limit", () => {
    expect(() => validateMemberFile({ name: "nid.pdf", type: "application/pdf", size: 10 * 1024 * 1024 + 1 })).toThrow();
  });
});