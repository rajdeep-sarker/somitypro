type Store = { getItem: (key: string) => string | null | Promise<string | null>; setItem: (key: string, value: string) => void | Promise<unknown>; removeItem: (key: string) => void | Promise<unknown> };
export const loginModeKey = "somiti-login-mode";
export const rememberChoiceKey = "somiti-remember-me";

export function createLoginStorage(persistent: Store, temporary: Storage, preferences?: Storage) {
  const sessionOnly = () => preferences?.getItem(rememberChoiceKey) === "false" || (preferences?.getItem(rememberChoiceKey) == null && temporary.getItem(loginModeKey) === "session");
  return {
    getItem: (key: string) => sessionOnly() ? temporary.getItem(key) : persistent.getItem(key),
    setItem: async (key: string, value: string) => {
      if (sessionOnly()) { temporary.setItem(key, value); await persistent.removeItem(key); }
      else { temporary.removeItem(key); await persistent.setItem(key, value); }
    },
    removeItem: async (key: string) => { temporary.removeItem(key); await persistent.removeItem(key); },
  };
}

export function chooseLoginPersistence(remember: boolean, temporary: Storage, preferences: Storage) {
  temporary.setItem(loginModeKey, remember ? "persistent" : "session");
  preferences.setItem(rememberChoiceKey, String(remember));
}