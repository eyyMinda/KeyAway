"use client";

import { I18nProvider } from "@/src/contexts/i18n";
import type { DictObject } from "@/src/contexts/i18n";

export default function I18nShell({
  locale,
  messages,
  children
}: {
  locale: string;
  messages: DictObject;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}
