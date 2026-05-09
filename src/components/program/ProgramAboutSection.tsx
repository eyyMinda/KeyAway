import AboutSectionBlock from "@/src/components/program/AboutSectionBlock";
import { formatProgramDisplayTitle } from "@/src/lib/program/formatProgramDisplayTitle";
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import type { Program } from "@/src/types";

export default function ProgramAboutSection({ program }: { program: Program }) {
  const blocks = program.aboutSections?.filter(s => portableTextHasContent(s.description));
  if (!blocks?.length) return null;

  return (
    <section className="border-t border-[#2a475e] bg-[#0f1923] py-10 sm:py-16">
      <div className="max-w-360 mx-auto flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <h2 className="section-title mb-10 sm:mb-12">
          <span className="text-gradient-pro">About</span> {formatProgramDisplayTitle(program)}
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
