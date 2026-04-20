import { FaKey, FaDownload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export type ActivationStepKey = "download" | "activate" | "paste";

export type ActivationStepOverrides = Partial<
  Record<ActivationStepKey, Partial<{ title: string; description: string }>>
>;

interface ActivationInstructionsProps {
  programTitle: string;
  /** When set (e.g. on program detail), the download-step icon opens this URL. */
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
  const defaults: Record<
    ActivationStepKey,
    { icon: typeof FaDownload; title: string; description: string; color: string; bgColor: string }
  > = {
    download: {
      icon: FaDownload,
      title: "Download the official build",
      description: `Use the download button above to get ${programTitle} from the developer's official site (recommended for safe activation).`,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    activate: {
      icon: FaKey,
      title: "Open activation in the app",
      description: `Launch ${programTitle} and find “Enter a key”, “Already have a license”, or “Activate” in the menu or settings.`,
      color: "text-primary-400",
      bgColor: "bg-primary-500/20"
    },
    paste: {
      icon: FaCheckCircle,
      title: "Paste your free CD key",
      description: `Copy a working key from the table on this page and paste it into the activation field in ${programTitle}.`,
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

  const tips = [
    {
      icon: FaExclamationTriangle,
      text: `Download ${programTitle} only from the official vendor or the link on this page — avoid repacked installers.`
    },
    {
      icon: FaExclamationTriangle,
      text: "If a giveaway CD key fails, try another working key from the list."
    },
    {
      icon: FaExclamationTriangle,
      text: "Some programs need an internet connection to verify your license during activation."
    }
  ];

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-3 sm:mb-4">
            How to activate <span className="text-gradient-pro">{programTitle}</span> with a free CD key
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-300 max-w-3xl mx-auto px-2">
            Giveaway keys and activation steps for {programTitle} — unlock Pro features with a verified license from our
            list.
          </p>
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
            Important tips
          </h3>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            {tips.map((tip, index) => (
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
