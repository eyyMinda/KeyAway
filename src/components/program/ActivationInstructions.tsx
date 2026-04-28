"use client";

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
  "inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900";

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
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    activate: {
      icon: FaKey,
      title: programT.activationInstructions.steps.activate.title(vars),
      description: programT.activationInstructions.steps.activate.description(vars),
      color: "text-primary-400",
      bgColor: "bg-primary-500/20"
    },
    paste: {
      icon: FaCheckCircle,
      title: programT.activationInstructions.steps.paste.title(vars),
      description: programT.activationInstructions.steps.paste.description(vars),
      color: "text-green-400",
      bgColor: "bg-green-500/20"
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

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 sm:mb-4">
            <span className="text-gradient-pro">{pageTitle}</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300 max-w-3xl mx-auto px-2">{pageLead}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {steps.map((step, index) => {
            const isDownloadWithLink = index === 0 && downloadHref.length > 0;
            const iconClasses = `${downloadIconBoxClass} ${step.bgColor}`;
            const iconEl = <step.icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${step.color}`} />;

            return (
              <div key={index} className="text-center group">
                {isDownloadWithLink ? (
                  <a
                    href={downloadHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={iconClasses}
                    aria-label={`Download ${programTitle} from official source (opens in new tab)`}>
                    {iconEl}
                  </a>
                ) : (
                  <div className={iconClasses}>{iconEl}</div>
                )}
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-2 sm:mb-3">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed px-2">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6 text-center">
            {tipsSectionTitle}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {tipBlocks.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                  <tip.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                </div>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
