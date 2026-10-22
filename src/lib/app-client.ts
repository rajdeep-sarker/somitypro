import { brokeredPreviewStorage } from "@/integrations/supabase/previewAuthStorage";
import { createLoginStorage } from "./login-storage";
import { changeOwnPassword, loginWithPhone, signUpAccount } from "./auth.functions";

// App session storage (Firebase-backed auth). The session token is kept in
// the Remember-Me aware storage adapter, exactly like before.

const KEY = "somiti-session";

type User = { id: string; email: string; full_name?: string; phone?: string };
type Session = { access_token: string; user: User };
type Result<T> = { data: T; error: Error | null };

type Store = ReturnType<typeof createLoginStorage>;
let storage: Store | null = null;
function store(): Store {
  if (!storage) {
    const persistent = typeof window !== "undefined" ? brokeredPreviewStorage() : null;
    storage = createLoginStorage(persistent ?? window.localStorage, window.sessionStorage, window.localStorage);
  }
  return storage;
}

type Listener = (event: string) => void;
const listeners = new Set<Listener>();
const emit = (event: string) => listeners.forEach((cb) => cb(event));

function decode(token: string): { uid: string; email: string; name: string; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[0]!.replace(/-/g, "+").replace(/_/g, "/"))) as { uid: string; email: string; name: string; exp: number };
    return payload.exp * 1000 > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export const auth = {
  async getSession(): Promise<Result<{ session: Session | null }>> {
    const token = await store().getItem(KEY);
    const payload = token ? decode(token) : null;
    if (!token || !payload) return { data: { session: null }, error: null };
    return { data: { session: { access_token: token, user: { id: payload.uid, email: payload.email, full_name: payload.name } } }, error: null };
  },
  async getUser(): Promise<Result<{ user: User | null }>> {
    const { data } = await this.getSession();
    return data.session ? { data: { user: data.session.user }, error: null } : { data: { user: null }, error: new Error("no session") };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }): Promise<Result<{ session: Session | null; user: User | null }>> {
    try {
      const r = await loginWithPhone({ data: { phone: email.split("@")[0] ?? "", password } });
      await store().setItem(KEY, r.token);
      emit("SIGNED_IN");
      return { data: { session: { access_token: r.token, user: r.user }, user: r.user }, error: null };
    } catch (error) {
      return { data: { session: null, user: null }, error: error instanceof Error ? error : new Error("লগইন হয়নি") };
    }
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string; phone?: string } } }): Promise<Result<{ session: Session | null; user: User | null }>> {
    try {
      const r = await signUpAccount({ data: { phone: options?.data?.phone ?? email.split("@")[0] ?? "", password, name: options?.data?.full_name ?? "" } });
      await store().setItem(KEY, r.token);
      emit("SIGNED_IN");
      return { data: { session: { access_token: r.token, user: r.user }, user: r.user }, error: null };
    } catch (error) {
      return { data: { session: null, user: null }, error: error instanceof Error ? error : new Error("অ্যাকাউন্ট তৈরি হয়নি") };
    }
  },
  async signOut(): Promise<void> {
    await store().removeItem(KEY);
    emit("SIGNED_OUT");
  },
  async updateUser({ password, current_password }: { password: string; current_password?: string }): Promise<{ error: Error | null }> {
    try {
      await changeOwnPassword({ data: { current: current_password ?? "", next: password } });
      emit("USER_UPDATED");
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("পাসওয়ার্ড পরিবর্তন হয়নি") };
    }
  },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

export async function getAccessToken(): Promise<string | null> {
  const { data } = await auth.getSession();
  return data.session?.access_token ?? null;
}
