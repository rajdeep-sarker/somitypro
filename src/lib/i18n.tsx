import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";
const KEY = "somiti-lang";
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "bn", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => { if (localStorage.getItem(KEY) === "en") setLangState("en"); }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem(KEY, l); };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

/** `t(bangla, english)` picks the text for the chosen language. */
export function useLang() {
  const { lang, setLang } = useContext(Ctx);
  const t = (bn: string, en: string) => (lang === "en" ? en : bn);
  return { lang, setLang, t };
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" className="flex shrink-0 rounded-full border border-border bg-muted p-0.5 text-sm">
      {(["bn", "en"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
          className={"rounded-full px-3 py-1 font-semibold transition-colors " + (lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
          {l === "bn" ? "বাংলা" : "English"}
        </button>
      ))}
    </div>
  );
}
