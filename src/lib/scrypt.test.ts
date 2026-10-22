import { describe, expect, it } from "vitest";
import scryptJs from "scrypt-js";
const { scrypt } = scryptJs;

const hex = (buf: Uint8Array) => [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
const enc = new TextEncoder();

describe("scrypt password hashing", () => {
  it("matches the RFC 7914 test vector", async () => {
    const out = await scrypt(enc.encode(""), enc.encode(""), 16, 1, 1, 64);
    expect(hex(out)).toBe(
      "77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906",
    );
  });

  it("verifies a stored key‖salt hash round-trip", async () => {
    const salt = new Uint8Array(16).fill(7);
    const key = await scrypt(enc.encode("সঠিক-পাসওয়ার্ড"), salt, 16384, 8, 1, 32);
    const stored = new Uint8Array(48);
    stored.set(key);
    stored.set(salt, 32);
    const b64 = btoa(String.fromCharCode(...stored));
    const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const check = await scrypt(enc.encode("সঠিক-পাসওয়ার্ড"), raw.slice(32), 16384, 8, 1, 32);
    expect(hex(check)).toBe(hex(raw.slice(0, 32)));
    const wrong = await scrypt(enc.encode("ভুল"), raw.slice(32), 16384, 8, 1, 32);
    expect(hex(wrong)).not.toBe(hex(raw.slice(0, 32)));
  });
});
