"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { PortableText } from "@portabletext/react";
import { FaArrowDown, FaArrowUp, FaBold, FaHeading, FaItalic, FaLink, FaListUl, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { markdownToPortableText } from "@/src/lib/portableText/markdown";
import type { RichText } from "./programForm";

export const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-60";

export const subtleButton =
  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 cursor-pointer";

/** Full-width dashed row after the last item of a list, so long lists can be extended without scrolling up. */
export function AddRowButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-600 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/5 dark:hover:text-blue-400 disabled:opacity-40 disabled:pointer-events-none cursor-pointer">
      <FaPlus size={10} className="transition-transform group-hover:scale-110" />
      {label}
    </button>
  );
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function Card({
  title,
  description,
  actions,
  children
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  counter,
  children,
  htmlFor
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  counter?: { value: number; max: number };
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {counter && (
          <span
            className={`text-xs tabular-nums ${counter.value > counter.max ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-500"}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  placeholder,
  type = "text",
  maxCounter,
  disabled
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  placeholder?: string;
  type?: string;
  maxCounter?: number;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={id}
      counter={maxCounter ? { value: value.length, max: maxCounter } : undefined}>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className={`${inputClass} ${error ? "border-red-400 dark:border-red-500/70" : ""}`}
      />
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"}`}
        />
      </button>
      <span>
        <span className="block text-sm text-gray-800 dark:text-gray-200">{label}</span>
        {hint && <span className="block text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      </span>
    </label>
  );
}

/** Chips for a list of short strings (aliases, keywords). Enter or comma adds. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  hint
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const add = () => {
    const parts = draft
      .split(",")
      .map(p => p.trim())
      .filter(p => p && !values.includes(p));
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  };
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className={`${inputClass} flex flex-wrap items-center gap-1.5 py-1.5`}>
        {values.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter(x => x !== v))}
              className="text-gray-400 hover:text-red-500 cursor-pointer">
              <FaTimes size={10} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={values.length ? "" : placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={add}
          className="flex-1 min-w-24 bg-transparent outline-none text-sm py-0.5"
        />
      </div>
    </Field>
  );
}

/** Move up / move down / remove buttons for a repeatable item. */
export function ItemControls({
  index,
  count,
  onMove,
  onRemove,
  label
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  label: string;
}) {
  const btn =
    "p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer";
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
        <FaArrowUp size={12} />
      </button>
      <button
        type="button"
        className={btn}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        aria-label={`Move ${label} down`}>
        <FaArrowDown size={12} />
      </button>
      <button
        type="button"
        className={`${btn} hover:text-red-600 dark:hover:text-red-400`}
        onClick={onRemove}
        aria-label={`Remove ${label}`}>
        <FaTrash size={12} />
      </button>
    </div>
  );
}

const previewComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    h3: ({ children }: { children?: ReactNode }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
    h4: ({ children }: { children?: ReactNode }) => <h4 className="text-sm font-semibold mb-2">{children}</h4>,
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-l-2 border-gray-300 dark:border-gray-700 pl-3 italic mb-2">{children}</blockquote>
    )
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
    number: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>
  },
  marks: {
    link: ({ children, value }: { children?: ReactNode; value?: { href?: string } }) => (
      <a href={value?.href} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
        {children}
      </a>
    )
  }
};

/** Rich text edited as Markdown, with a small toolbar and a rendered preview. */
export function MarkdownField({
  label,
  value,
  onChange,
  rows = 4,
  hint,
  error,
  required,
  placeholder,
  compact
}: {
  label: string;
  value: RichText;
  onChange: (v: RichText) => void;
  rows?: number;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  /** Single-line-ish field (about points): no toolbar label row. */
  compact?: boolean;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const setMd = (md: string) => onChange({ ...value, md });

  /** Wraps the selection in `before`/`after`, or prefixes each selected line with `linePrefix`. */
  const apply = (before: string, after = before, linePrefix?: string) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value: text } = el;
    let next: string;
    let caretStart: number;
    let caretEnd: number;
    if (linePrefix) {
      const lineStart = text.lastIndexOf("\n", a - 1) + 1;
      const block = text.slice(lineStart, b);
      const prefixed = block
        .split("\n")
        .map(l => (l.startsWith(linePrefix) ? l.slice(linePrefix.length) : linePrefix + l))
        .join("\n");
      next = text.slice(0, lineStart) + prefixed + text.slice(b);
      caretStart = lineStart;
      caretEnd = lineStart + prefixed.length;
    } else {
      const selected = text.slice(a, b) || "text";
      next = text.slice(0, a) + before + selected + after + text.slice(b);
      caretStart = a + before.length;
      caretEnd = caretStart + selected.length;
    }
    setMd(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caretStart, caretEnd);
    });
  };

  const tool =
    "p-1.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer";

  const editor = (
    <div
      className={`rounded-lg border bg-white dark:bg-gray-950 focus-within:ring-2 focus-within:ring-blue-500/40 ${error ? "border-red-400 dark:border-red-500/70" : "border-gray-300 dark:border-gray-700"}`}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 rounded-t-lg">
        <button type="button" className={tool} onClick={() => apply("**")} title="Bold" aria-label="Bold" disabled={preview}>
          <FaBold size={11} />
        </button>
        <button type="button" className={tool} onClick={() => apply("*")} title="Italic" aria-label="Italic" disabled={preview}>
          <FaItalic size={11} />
        </button>
        {!compact && (
          <>
            <button
              type="button"
              className={tool}
              onClick={() => apply("", "", "### ")}
              title="Heading"
              aria-label="Heading"
              disabled={preview}>
              <FaHeading size={11} />
            </button>
            <button
              type="button"
              className={tool}
              onClick={() => apply("", "", "- ")}
              title="Bullet list"
              aria-label="Bullet list"
              disabled={preview}>
              <FaListUl size={11} />
            </button>
          </>
        )}
        <button
          type="button"
          className={tool}
          onClick={() => apply("[", "](https://)")}
          title="Link"
          aria-label="Link"
          disabled={preview}>
          <FaLink size={11} />
        </button>
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className={`ml-auto px-2 py-0.5 text-xs rounded cursor-pointer ${preview ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 min-h-16">
          {value.md.trim() ? (
            <PortableText value={markdownToPortableText(value.md)} components={previewComponents} />
          ) : (
            <span className="text-gray-400">Nothing to preview</span>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          ref={ref}
          rows={rows}
          value={value.md}
          placeholder={placeholder}
          onChange={e => setMd(e.target.value)}
          className="block w-full px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none resize-y font-[inherit] rounded-b-lg"
        />
      )}
    </div>
  );

  return (
    <Field
      label={label}
      required={required}
      error={error}
      htmlFor={id}
      hint={
        value.lossy && value.md !== value.originalMd ? (
          <span className="text-amber-600 dark:text-amber-400">
            This text had formatting the editor can&apos;t show (e.g. underline). It will be dropped when you save this edit.
          </span>
        ) : (
          hint
        )
      }>
      {editor}
    </Field>
  );
}
