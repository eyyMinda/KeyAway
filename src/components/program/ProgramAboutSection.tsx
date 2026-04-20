import AboutSectionBlock from "@/src/components/program/AboutSectionBlock";
import { formatProgramDisplayTitle } from "@/src/lib/program/formatProgramDisplayTitle";
import type { Program } from "@/src/types";

export default function ProgramAboutSection({ program }: { program: Program }) {
  const blocks = program.aboutSections?.filter(s => s.description?.trim());
  if (!blocks?.length) return null;

  return (
    <section className="py-10 sm:py-16 bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 border-t border-white/5">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-10 sm:mb-12 text-center">
          About <span className="text-gradient-pro">{formatProgramDisplayTitle(program)}</span>
        </h2>
        <div className="max-w-2xl lg:max-w-5xl mx-auto space-y-14 sm:space-y-16 lg:space-y-20">
          {blocks.map((section, index) => (
            <AboutSectionBlock key={`about-${index}`} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}
