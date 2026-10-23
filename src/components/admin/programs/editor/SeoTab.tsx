"use client";

import { MAX_META_DESC, MAX_META_TITLE } from "@/src/lib/admin/programFields";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { markdownToPortableText } from "@/src/lib/portableText/markdown";
import { Card, Field, TagInput, TextInput, Toggle, inputClass } from "./fields";
import type { TabProps } from "./types";

export default function SeoTab({ form, update }: TabProps) {
  const fallbackDescription = portableTextToPlainText(markdownToPortableText(form.description.md)).slice(0, MAX_META_DESC);

  return (
    <div className="space-y-5">
      <Card title="Search appearance" description="Optional overrides. Leave empty to use the automatic templates.">
        <TextInput
          label="Meta title"
          value={form.metaTitle}
          maxCounter={MAX_META_TITLE}
          placeholder={`${form.title || "Program"} … (automatic)`}
          onChange={metaTitle => update({ metaTitle })}
        />
        <Field label="Meta description" counter={{ value: form.metaDescription.length, max: MAX_META_DESC }}>
          <textarea
            rows={3}
            value={form.metaDescription}
            placeholder="Automatic from the description"
            onChange={e => update({ metaDescription: e.target.value })}
            className={inputClass}
          />
        </Field>
        <TagInput
          label="Meta keywords"
          values={form.metaKeywords}
          onChange={metaKeywords => update({ metaKeywords })}
          placeholder="Type and press Enter"
          hint="[title] is replaced with the store name from Store Details."
        />

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Search result preview (approximate)</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{typeof window !== "undefined" ? window.location.host : ""} › program › {form.slug || "…"}</p>
          <p className="text-lg leading-snug text-blue-700 dark:text-blue-400 truncate">{form.metaTitle || form.title || "Program title"}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{form.metaDescription || fallbackDescription || "…"}</p>
        </div>
      </Card>

      <Card title="Giveaway discovery" description="How the daily giveaway scan recognizes this program on other sites (Admin → Giveaway Finds).">
        <TagInput
          label="Aliases"
          values={form.aliases}
          onChange={aliases => update({ aliases })}
          placeholder="e.g. Ultra Pic"
          hint="Other names giveaway sites use. Case, spacing, vendor name, versions and words like Pro/Giveaway are ignored."
        />
        <Toggle
          label="Skip in giveaway scan"
          hint="For retired programs that should never be matched."
          checked={form.ignoreInScan}
          onChange={ignoreInScan => update({ ignoreInScan })}
        />
      </Card>
    </div>
  );
}
