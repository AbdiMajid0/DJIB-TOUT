"use client";

import { useLocale } from "@/lib/locale-client";

export default function SkipLink() {
  const { messages } = useLocale();
  return (
    <a href="#contenu" className="skip-link">
      {messages.skip}
    </a>
  );
}
