import { beforeEach, describe, expect, it } from "vitest";
import { chooseLoginPersistence, createLoginStorage } from "./login-storage";
describe("Remember Me", () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  it("keeps checked logins in persistent storage", async () => {
    chooseLoginPersistence(true, sessionStorage, localStorage);
    const store = createLoginStorage(localStorage, sessionStorage);
    await store.setItem("session", "test-session");
    sessionStorage.clear();
    expect(await store.getItem("session")).toBe("test-session");
  });
  it("does not persist unchecked logins after tab storage is cleared", async () => {
    localStorage.setItem("session", "previous-session");
    chooseLoginPersistence(false, sessionStorage, localStorage);
    const store = createLoginStorage(localStorage, sessionStorage);
    await store.setItem("session", "test-session");
    expect(await store.getItem("session")).toBe("test-session");
    expect(localStorage.getItem("session")).toBeNull();
    sessionStorage.clear();
    expect(await store.getItem("session")).toBeNull();
  });
  it("clears both stores on logout", async () => {
    localStorage.setItem("session", "old"); sessionStorage.setItem("session", "new");
    await createLoginStorage(localStorage, sessionStorage).removeItem("session");
    expect(localStorage.getItem("session")).toBeNull(); expect(sessionStorage.getItem("session")).toBeNull();
  });
});