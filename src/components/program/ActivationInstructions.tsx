"use client";

import { useMemo } from "react";
import { FaKey, FaDownload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useI18n } from "@/src/contexts/i18n";

export type ActivationStepKey = "download" | "activate" | "paste";

export type ActivationStepOverrides = Partial<
  Record<ActivationStepKey, Partial<{ title: string; description: string }>>
>;

interface ActivationInstructionsProps {
  programTitle: string;
  downloadLink?: string;
  stepOverrides?: ActivationStepOverrides;
}

const downloadIconBoxClass =
  "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm border sm:mb-6 sm:h-14 sm:w-14 lg:h-16 lg:w-16 group-hover:scale-110 transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1923]";

export default function ActivationInstructions({
  programTitle,
  downloadLink,
  stepOverrides
}: ActivationInstructionsProps) {
  const { t: programT, list } = useI18n("program");
  const { t: commonT } = useI18n("common");
  const vars = { programTitle };

  const defaults: Record<
    ActivationStepKey,
    { icon: typeof FaDownload; title: string; description: string; color: string; bgColor: string }
  > = {
    download: {
      icon: FaDownload,
      title: commonT.downloadStepTitle(),
      description: commonT.downloadStepDescription(vars),
      color: "text-[#66c0f4]",
      bgColor: "bg-[#1a3a5c] border-[#4a90c4]"
    },
    activate: {
      icon: FaKey,
      title: programT.activationInstructions.steps.activate.title(vars),
      description: programT.activationInstructions.steps.activate.description(vars),
      color: "text-[#66c0f4]",
      bgColor: "bg-[#213246] border-[#2a475e]"
    },
    paste: {
      icon: FaCheckCircle,
      title: programT.activationInstructions.steps.paste.title(vars),
      description: programT.activationInstructions.steps.paste.description(vars),
      color: "text-[#5ba32b]",
      bgColor: "bg-[#1a3a2a] border-[#3d6e1c]"
    }
  };

  const keys: ActivationStepKey[] = ["download", "activate", "paste"];
  const steps = keys.map(key => {
    const base = defaults[key];
    const ov = stepOverrides?.[key];
    return {
      ...base,
      title: ov?.title ?? base.title,
      description: ov?.description ?? base.description
    };
  });

  const downloadHref = downloadLink?.trim() ?? "";

  const tipTexts = list("activationInstructions.tips", vars);
  const tipBlocks = tipTexts.map(text => ({
    icon: FaExclamationTriangle,
    text
  }));

  const pageTitle = programT.activationInstructions.pageTitle(vars);
  const pageLead = programT.activationInstructions.pageLead(vars);
  const tipsSectionTitle = commonT.activationTipsSectionTitle();

  const activationTitleParts = useMemo(() => {
    const needle = programTitle.trim();
    if (!needle) return { before: pageTitle, middle: "", after: "" as string };
    const idx = pageTitle.indexOf(needle);
    if (idx === -1) return { before: pageTitle, middle: "", after: "" as string };
    return {
      before: pageTitle.slice(0, idx),
      middle: needle,
      after: pageTitle.slice(idx + needle.length)
    };
  }, [pageTitle, programTitle]);

  return (
    <section className="border-t border-[#2a475e] bg-[#0f1923] py-8 sm:py-12 lg:py-16">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="section-label mb-3">Activation Guide</div>
          <h2 className="section-title mb-3 sm:mb-4">
            {activationTitleParts.before}
            {activationTitleParts.middle ? <span>{activationTitleParts.middle}</span> : null}
            {activationTitleParts.after.trim() ? (
              <span className="text-gradient-pro">{activationTitleParts.after}</span>
            ) : null}
          </h2>
          <p className="max-w-3xl px-2 text-sm text-[#8f98a0] sm:text-base lg:text-lg xl:text-xl">{pageLead}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {steps.map((step, index) => {
            const isDownloadWithLink = index === 0 && downloadHref.length > 0;
            const iconClasses = `${downloadIconBoxClass} ${step.bgColor}`;
            const iconEl = <step.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${step.color}`} />;

            return (
              <div key={index} className="card-base group p-5 text-left sm:p-6">
                {isDownloadWithLink ? (
                  <a
                    href={downloadHref}
                    target="_blank"
                    rel="nofollow noopener"
                    className={iconClasses}
                    aria-label={`Download ${programTitle} from official source (opens in new tab)`}>
                    {iconEl}
                  </a>
                ) : (
                  <div className={iconClasses}>{iconEl}</div>
                )}
                <h3 className="mb-2 text-base font-semibold text-[#c6d4df] sm:mb-3 sm:text-lg lg:text-xl">{step.title}</h3>
                <p className="px-2 text-sm leading-relaxed text-[#8f98a0] sm:text-base">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] p-5 sm:p-6 lg:p-8">
          <h3 className="mb-4 text-base font-semibold text-[#c6d4df] sm:mb-6 sm:text-lg lg:text-xl">
            {tipsSectionTitle}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {tipBlocks.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-[#3a2800] sm:h-6 sm:w-6">
                  <tip.icon className="h-2.5 w-2.5 text-[#e8632a] sm:h-3 sm:w-3" />
                </div>
                <p className="text-xs leading-relaxed text-[#c6d4df] sm:text-sm">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
