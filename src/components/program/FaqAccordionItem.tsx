"use client";

import { useId, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import type { PortableTextBlock } from "@portabletext/types";
import RichText from "@/src/components/portableText/RichText";

type Props = { question: string; answer: PortableTextBlock[] | string };

/** Controlled accordion so grid-template-rows can animate every toggle (native details often skips repeat animations). */
export default function FaqAccordionItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors duration-300 ${
        open ? "border-primary-500/30 bg-white/[0.07]" : ""
      }`}>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={`${panelId}-panel`}
        onClick={() => setOpen(v => !v)}
        className="flex w-full cursor-pointer list-none items-start justify-between gap-3 p-4 sm:p-5 text-left">
        <span className="text-sm sm:text-base font-semibold text-white pr-2">{question}</span>
        <FaChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}>
        <div className="min-h-0">
          <div className="border-t border-white/10 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
            <div className="pt-3 text-sm sm:text-base text-gray-300 leading-relaxed [&_a]:text-primary-300 [&_p]:my-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
              <RichText value={answer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
