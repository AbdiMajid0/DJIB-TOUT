"use client";

import { localeConfig, locales, Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-client";
import { useEffect } from "react";

export default function LanguageSwitcher() {
  const { locale, messages, setLocale } = useLocale();

  useEffect(() => {
    queueMicrotask(() => setLocale(locale));
  }, [locale, setLocale]);

  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
      <span>{messages.language}</span>
      <select
        aria-label={messages.chooseLanguage}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        className="rounded-lg border bg-white px-2 py-2"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeConfig[code].label}
          </option>
        ))}
      </select>
    </label>
  );
}
