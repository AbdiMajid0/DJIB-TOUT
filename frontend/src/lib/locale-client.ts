"use client";

import { useSyncExternalStore } from "react";
import { Locale, localeConfig, locales, messages } from "@/lib/i18n";

const EVENT = "djibtout:locale-change";

function readLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem("locale") as Locale | null;
  return saved && locales.includes(saved) ? saved : "fr";
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function setLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeConfig[locale].dir;
  localStorage.setItem("locale", locale);
  document.cookie = `DJIBTOUT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event(EVENT));
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribe,
    readLocale,
    () => "fr" as Locale,
  );
  return { locale, messages: messages[locale], setLocale };
}
