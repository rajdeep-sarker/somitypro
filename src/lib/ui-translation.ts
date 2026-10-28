import copy from "./ui-copy.json";

const dictionary: Record<string, string> = copy;
const fragments = Object.keys(dictionary).filter((key) => key.length > 1).sort((a, b) => b.length - a.length);
export function translateUi(text: string, lang: "bn" | "en"): string {
  if (lang !== "en" || !/[\u0980-\u09ff]/.test(text)) return text;
  const trimmed = text.trim();
  if (dictionary[trimmed]) return text.replace(trimmed, dictionary[trimmed]);
  // Static sentence fragments around formatted amounts/counts share the same glossary.
  let translated = text;
  for (const key of fragments) {
    if (translated.includes(key)) translated = translated.split(key).join(dictionary[key] ?? key);
    if (!/[\u0980-\u09ff]/.test(translated)) break;
  }
  return translated.replace(/[০-৯]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6));
}

export function interfaceLanguage(): "bn" | "en" {
  return typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "bn";
}
export const uiText = (text: string) => translateUi(text, interfaceLanguage());