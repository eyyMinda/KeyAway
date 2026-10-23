"use client";

import { FaExternalLinkAlt } from "react-icons/fa";
import { newKey } from "@/src/lib/admin/programFields";
import type { ProgramFlow, ProgramPlatform } from "@/src/types/program";
import { Card, Field, TextInput, inputClass } from "./fields";
import type { EditorLookups, TabProps } from "./types";
import VersionTrackingCard from "./VersionTrackingCard";

const FLOW_OPTIONS: { value: ProgramFlow; label: string; hint: string }[] = [
  { value: "cd_key", label: "CD keys", hint: "Classic license keys" },
  { value: "link_based_cdkey", label: "Link-based CD keys", hint: "Giveaway page → private key" },
  { value: "account", label: "PRO accounts", hint: "Shared username + password" },
  { value: "link_based_account", label: "Links to PRO accounts", hint: "Signup / partner links" }
];

const PLATFORMS: { value: ProgramPlatform; label: string }[] = [
  { value: "windows", label: "Windows" },
  { value: "mac", label: "Mac" }
];

const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
    on
      ? "bg-blue-600 border-blue-600 text-white"
      : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400"
  }`;

interface BasicsTabProps extends TabProps {
  lookups: EditorLookups;
  isNew: boolean;
  /** Slug the program was loaded with (warns before changing a live URL). */
  savedSlug: string;
  versionStatus?: { latestVersion?: string | null; error?: string | null; changedAt?: string | null } | null;
}

export default function BasicsTab({ form, update, errorOf, lookups, isNew, savedSlug, versionStatus }: BasicsTabProps) {
  const slugChanged = !isNew && !!savedSlug && form.slug !== savedSlug;

  return (
    <div className="space-y-5">
      <Card title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Title"
            required
            value={form.title}
            error={errorOf("title")}
            placeholder="e.g. IObit Driver Booster"
            onChange={title => update({ title })}
          />
          <TextInput
            label="Slug"
            required
            value={form.slug}
            error={errorOf("slug")}
            placeholder="driver-booster"
            onChange={slug => update({ slug })}
            hint={
              slugChanged ? (
                <span className="text-amber-600 dark:text-amber-400">
                  Changes the public URL from /program/{savedSlug}. Old links will stop working.
                </span>
              ) : (
                `/program/${form.slug || "…"}`
              )
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Vendor"
            required
            error={errorOf("vendor")}
            hint={
              <a href="/studio/structure/group-programs;vendor" target="_blank" className="inline-flex items-center gap-1 hover:underline">
                Add a new vendor in Studio <FaExternalLinkAlt size={9} />
              </a>
            }>
            <select
              value={form.vendorId}
              onChange={e => update({ vendorId: e.target.value })}
              className={`${inputClass} cursor-pointer`}>
              <option value="">Select a vendor…</option>
              {lookups.vendors.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Platforms" required error={errorOf("platforms")}>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const on = form.platforms.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    className={chip(on)}
                    onClick={() =>
                      update({ platforms: on ? form.platforms.filter(x => x !== p.value) : [...form.platforms, p.value] })
                    }>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <Field label="Categories" hint="Used for related-program recommendations.">
          <div className="flex flex-wrap gap-2">
            {lookups.categories.map(c => {
              const on = form.categories.some(x => x._ref === c._id);
              return (
                <button
                  key={c._id}
                  type="button"
                  className={chip(on)}
                  onClick={() =>
                    update({
                      categories: on
                        ? form.categories.filter(x => x._ref !== c._id)
                        : [...form.categories, { _key: newKey(), _ref: c._id }]
                    })
                  }>
                  {c.title}
                </button>
              );
            })}
          </div>
        </Field>
      </Card>

      <Card title="Activation flow" description="How visitors get PRO access. Changing it changes which fields the Keys tab asks for.">
        <div className="grid gap-2 sm:grid-cols-2">
          {FLOW_OPTIONS.map(opt => {
            const on = form.programFlow === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ programFlow: opt.value })}
                className={`text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                  on
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-500"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                }`}>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.hint}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Version & links">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
          <TextInput
            label="Latest official version"
            value={form.latestOfficialVersion}
            placeholder="18.5"
            onChange={latestOfficialVersion => update({ latestOfficialVersion })}
            hint="From the vendor site. Keys keep their own versions."
          />
          <TextInput
            label="Download link"
            type="url"
            value={form.downloadLink}
            error={errorOf("downloadLink")}
            placeholder="https://"
            onChange={downloadLink => update({ downloadLink })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Affiliate PRO URL"
            type="url"
            value={form.affiliateProUrl}
            error={errorOf("affiliatePro.affiliateProUrl")}
            placeholder="https://"
            onChange={affiliateProUrl => update({ affiliateProUrl })}
            hint="Upgrade button under the keys table. Empty hides it."
          />
          <TextInput
            label="Affiliate button label"
            value={form.affiliateProLabel}
            placeholder="Get Driver Booster PRO (official store)"
            onChange={affiliateProLabel => update({ affiliateProLabel })}
          />
        </div>
      </Card>

      <VersionTrackingCard form={form} update={update} errorOf={errorOf} status={versionStatus} />
    </div>
  );
}
