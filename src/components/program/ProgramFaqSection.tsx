import FaqAccordionItem from "@/src/components/program/FaqAccordionItem";
import type { ProgramFaqItem } from "@/src/types";

export default function ProgramFaqSection({ programTitle, items }: { programTitle: string; items: ProgramFaqItem[] }) {
  if (!items || items.length < 2) return null;

  return (
    <section id="faq" className="border-t border-[#2a475e] bg-[#0f1923] py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-4 lg:gap-8">
          <div className="flex flex-col gap-3">
            <div className="section-label">FAQ</div>
            <h2 className="section-title flex flex-col">
              <span>{programTitle}</span>
              <span className="text-gradient-pro">Frequently Asked Questions</span>
            </h2>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <FaqAccordionItem key={`${item.question}-${index}`} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
