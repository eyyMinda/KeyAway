"use client";

import { useState } from "react";
import { FaChevronDown, FaPlus } from "react-icons/fa";
import { MAX_ABOUT_SECTIONS, newKey } from "@/src/lib/admin/programFields";
import { AddRowButton, Card, ItemControls, MarkdownField, TextInput, Toggle, inputClass, moveItem, subtleButton } from "./fields";
import ImagePicker from "./ImagePicker";
import { emptyRichText, newAboutSection, type AboutSectionForm } from "./programForm";
import type { ImageTabProps } from "./types";

function firstLine(md: string): string {
  const line = md.replace(/[#*>`\\-]/g, "").trim().split("\n")[0] ?? "";
  return line.length > 80 ? `${line.slice(0, 80)}…` : line;
}

export default function ContentTab({ form, update, errorOf, openLibrary }: ImageTabProps) {
  const [openAbout, setOpenAbout] = useState<string | null>(form.about[0]?._key ?? null);
  // Item added from an "Add …" button: its first input takes focus.
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const setAbout = (i: number, patch: Partial<AboutSectionForm>) =>
    update({ about: form.about.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const addAbout = () => {
    const section = newAboutSection();
    update({ about: [...form.about, section] });
    setOpenAbout(section._key);
  };
  const addPoint = (i: number) =>
    setAbout(i, { points: [...form.about[i].points, { _key: newKey(), text: emptyRichText(), icon: { assetId: null } }] });
  const addFaq = () => {
    const _key = newKey();
    update({ faq: [...form.faq, { _key, question: "", answer: emptyRichText() }] });
    setJustAdded(_key);
  };
  const addFreeVsPro = () => {
    const _key = newKey();
    update({ freeVsPro: [...form.freeVsPro, { _key, feature: "", free: "", pro: "" }] });
    setJustAdded(_key);
  };
  const aboutFull = form.about.length >= MAX_ABOUT_SECTIONS;

  return (
    <div className="space-y-5">
      <Card title="Description" description="Short summary at the top of the program page. Unique to this program: what it is and who it's for.">
        <MarkdownField
          label="Description"
          required
          rows={5}
          value={form.description}
          error={errorOf("description")}
          onChange={description => update({ description })}
        />
      </Card>

      <Card
        title={`About sections (${form.about.length}/${MAX_ABOUT_SECTIONS})`}
        description="Feature blocks with optional image and bullet points."
        actions={
          <button
            type="button"
            className={subtleButton}
            disabled={aboutFull}
            onClick={addAbout}>
            <FaPlus size={10} /> Add section
          </button>
        }>
        {form.about.map((section, i) => {
          const open = openAbout === section._key;
          const sectionErrors = [errorOf(`aboutSections.${i}.description`)].concat(
            section.points.map((_, j) => errorOf(`aboutSections.${i}.points.${j}`))
          );
          const hasError = sectionErrors.some(Boolean);
          return (
            <div
              key={section._key}
              className={`rounded-lg border ${hasError ? "border-red-300 dark:border-red-500/50" : "border-gray-200 dark:border-gray-800"}`}>
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenAbout(open ? null : section._key)}
                  className="flex flex-1 min-w-0 items-center gap-2 text-left cursor-pointer">
                  <FaChevronDown size={10} className={`shrink-0 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`} />
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">{i + 1}</span>
                  <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {section.sectionTitle || firstLine(section.description.md) || "Untitled section"}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {section.points.length ? `${section.points.length} points` : ""}
                    {section.image.assetId ? " · image" : ""}
                  </span>
                </button>
                <ItemControls
                  index={i}
                  count={form.about.length}
                  label="section"
                  onMove={to => update({ about: moveItem(form.about, i, to) })}
                  onRemove={() => update({ about: form.about.filter((_, j) => j !== i) })}
                />
              </div>
              {open && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="space-y-4">
                      <TextInput
                        label="Title"
                        value={section.sectionTitle}
                        placeholder="Optional heading"
                        onChange={sectionTitle => setAbout(i, { sectionTitle })}
                      />
                      <MarkdownField
                        label="Description"
                        required
                        rows={4}
                        value={section.description}
                        error={errorOf(`aboutSections.${i}.description`)}
                        onChange={description => setAbout(i, { description })}
                      />
                    </div>
                    <div className="space-y-3 md:w-56">
                      <ImagePicker
                        label="Image"
                        value={section.image}
                        onChange={image => setAbout(i, { image })}
                        onOpenLibrary={openLibrary}
                        animationToggle
                        hint="Side-by-side on desktop; centered text if empty."
                      />
                      <Toggle
                        label="Desktop: image on the right"
                        checked={section.invertDesktop}
                        onChange={invertDesktop => setAbout(i, { invertDesktop })}
                      />
                      <Toggle
                        label="Mobile: image below text"
                        checked={section.invertMobile}
                        onChange={invertMobile => setAbout(i, { invertMobile })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Points</p>
                      <button
                        type="button"
                        className={subtleButton}
                        onClick={() => addPoint(i)}>
                        <FaPlus size={10} /> Add point
                      </button>
                    </div>
                    <div className="space-y-2">
                      {section.points.map((point, j) => (
                        <div
                          key={point._key}
                          className="flex items-start gap-3 rounded-lg bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 p-2.5">
                          <ImagePicker
                            label="Icon"
                            small
                            value={point.icon}
                            onChange={icon =>
                              setAbout(i, { points: section.points.map((p, k) => (k === j ? { ...p, icon } : p)) })
                            }
                            onOpenLibrary={openLibrary}
                          />
                          <div className="flex-1 min-w-0">
                            <MarkdownField
                              label={`Point ${j + 1}`}
                              compact
                              rows={2}
                              value={point.text}
                              error={errorOf(`aboutSections.${i}.points.${j}`)}
                              placeholder="**Feature:** what it does for the user"
                              onChange={text =>
                                setAbout(i, { points: section.points.map((p, k) => (k === j ? { ...p, text } : p)) })
                              }
                            />
                          </div>
                          <ItemControls
                            index={j}
                            count={section.points.length}
                            label="point"
                            onMove={to => setAbout(i, { points: moveItem(section.points, j, to) })}
                            onRemove={() => setAbout(i, { points: section.points.filter((_, k) => k !== j) })}
                          />
                        </div>
                      ))}
                      <AddRowButton label="Add point" onClick={() => addPoint(i)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <AddRowButton label={aboutFull ? `Maximum ${MAX_ABOUT_SECTIONS} sections` : "Add section"} onClick={addAbout} disabled={aboutFull} />
      </Card>

      <Card
        title={`FAQ (${form.faq.length})`}
        description="Use 0 or at least 2 questions (FAQ rich results need 2+)."
        actions={
          <button
            type="button"
            className={subtleButton}
            onClick={addFaq}>
            <FaPlus size={10} /> Add question
          </button>
        }>
        {errorOf("faq") && <p className="text-xs text-red-600 dark:text-red-400">{errorOf("faq")}</p>}
        {form.faq.map((item, i) => (
          <div key={item._key} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 text-xs font-semibold text-gray-400 tabular-nums w-5">Q{i + 1}</span>
              <div className="flex-1 min-w-0">
                <input
                  value={item.question}
                  placeholder="Question"
                  aria-label={`Question ${i + 1}`}
                  autoFocus={item._key === justAdded}
                  onChange={e => update({ faq: form.faq.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)) })}
                  className={`${inputClass} font-medium ${errorOf(`faq.${i}.question`) ? "border-red-400" : ""}`}
                />
              </div>
              <ItemControls
                index={i}
                count={form.faq.length}
                label="question"
                onMove={to => update({ faq: moveItem(form.faq, i, to) })}
                onRemove={() => update({ faq: form.faq.filter((_, j) => j !== i) })}
              />
            </div>
            <div className="pl-7">
              <MarkdownField
                label="Answer"
                rows={3}
                value={item.answer}
                error={errorOf(`faq.${i}.answer`) ?? errorOf(`faq.${i}.question`)}
                onChange={answer => update({ faq: form.faq.map((f, j) => (j === i ? { ...f, answer } : f)) })}
              />
            </div>
          </div>
        ))}
        <AddRowButton label="Add question" onClick={addFaq} />
      </Card>

      <Card
        title={`Free vs Official PRO (${form.freeVsPro.length})`}
        description="Feature table on the program page: what the free edition offers vs the paid PRO license."
        actions={
          <button
            type="button"
            className={subtleButton}
            onClick={addFreeVsPro}>
            <FaPlus size={10} /> Add row
          </button>
        }>
        {form.freeVsPro.length > 0 && (
          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-0.5">
              <span>Feature</span>
              <span>Free</span>
              <span>Official PRO</span>
              <span className="w-[84px]" />
            </div>
            {form.freeVsPro.map((row, i) => {
              const set = (patch: Partial<typeof row>) =>
                update({ freeVsPro: form.freeVsPro.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
              return (
                <div key={row._key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <input
                    value={row.feature}
                    placeholder="Updates"
                    aria-label="Feature"
                    autoFocus={row._key === justAdded}
                    onChange={e => set({ feature: e.target.value })}
                    className={`${inputClass} ${errorOf(`freeVsProComparison.${i}`) ? "border-red-400" : ""}`}
                  />
                  <input value={row.free} placeholder="Manual only" aria-label="Free" onChange={e => set({ free: e.target.value })} className={inputClass} />
                  <input
                    value={row.pro}
                    placeholder="Automatic & background"
                    aria-label="Official PRO"
                    onChange={e => set({ pro: e.target.value })}
                    className={inputClass}
                  />
                  <ItemControls
                    index={i}
                    count={form.freeVsPro.length}
                    label="row"
                    onMove={to => update({ freeVsPro: moveItem(form.freeVsPro, i, to) })}
                    onRemove={() => update({ freeVsPro: form.freeVsPro.filter((_, j) => j !== i) })}
                  />
                </div>
              );
            })}
          </div>
        )}
        <AddRowButton label="Add row" onClick={addFreeVsPro} />
      </Card>
    </div>
  );
}
