"use client";

import React, { createContext, useContext, useMemo } from "react";

type Vars = Record<string, string | number>;
type DictValue = string | DictObject | DictValue[];
export type DictObject = { [key: string]: DictValue };

type SegmentCallable = ((vars?: Vars) => string) & { _segments: string[] };
export type I18nT = SegmentCallable & { readonly [key: string]: I18nT };

type I18nContextValue = {
  locale: string;
  messages: DictObject;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(obj: DictObject, path: string[]): DictValue | undefined {
  let cur: DictValue | undefined = obj;
  for (const p of path) {
    if (!cur || typeof cur !== "object" || Array.isArray(cur)) return undefined;
    cur = (cur as DictObject)[p];
  }
  return cur;
}

function interpolate(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`
  );
}

function makeT(messages: DictObject, segments: string[]): I18nT {
  const fn = ((vars?: Vars) => {
    const resolved = getByPath(messages, segments);
    const varsObj = vars ?? {};
    if (typeof resolved === "string") return interpolate(resolved, varsObj);
    return segments.join(".");
  }) as SegmentCallable;
  fn._segments = segments;

  return new Proxy(fn, {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string" || prop === "then") return undefined;
      return makeT(messages, [...target._segments, prop]);
    }
  }) as I18nT;
}

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: string;
  messages: DictObject;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(namespace?: string) {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");

  const segments = namespace ? [namespace] : [];
  const t = useMemo(() => makeT(ctx.messages, segments), [ctx.messages, namespace]);

  const list = (path: string, vars: Vars = {}) => {
    const parts = [...segments, ...path.split(".").filter(Boolean)];
    const resolved = getByPath(ctx.messages, parts);
    if (!Array.isArray(resolved)) return [];
    return resolved.map(item => (typeof item === "string" ? interpolate(item, vars) : String(item)));
  };

  return { locale: ctx.locale, t, list };
}
