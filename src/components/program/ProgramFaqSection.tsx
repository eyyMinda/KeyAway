import FaqAccordionItem from "@/src/components/program/FaqAccordionItem";
import type { ProgramFaqItem } from "@/src/types";

export default function ProgramFaqSection({ programTitle, items }: { programTitle: string; items: ProgramFaqItem[] }) {
  if (!items || items.length < 2) return null;

  return (
    <section
      id="faq"
      className="py-8 sm:py-10 bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:gap-16 xl:gap-24 items-center">
          <h2 className="flex flex-col items-center text-2xl lg:text-3xl xl:text-4xl font-bold text-white text-center">
            <span>{programTitle}</span>
            <span className="text-gradient-pro">Frequently Asked Questions</span>
          </h2>

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
