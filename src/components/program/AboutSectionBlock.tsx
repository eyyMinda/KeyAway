import Image from "next/image";
import { IdealImage } from "@/src/components/general/IdealImage";
import RichText from "@/src/components/portableText/RichText";
import { urlFor } from "@/src/sanity/lib/image";
import type { ProgramAboutSectionBlock } from "@/src/types";
import type { SanityImageSource } from "@sanity/image-url";

function hasAsset(img: ProgramAboutSectionBlock["image"]): img is NonNullable<ProgramAboutSectionBlock["image"]> & {
  asset: NonNullable<ProgramAboutSectionBlock["image"]>["asset"];
} {
  return Boolean(img?.asset);
}

export default function AboutSectionBlock({ section }: { section: ProgramAboutSectionBlock }) {
  const { sectionTitle, description, image, invertDesktop, invertMobile, points } = section;
  const hasImage = hasAsset(image);

  const content = (
    <div className="mx-auto max-w-3xl text-start">
      {sectionTitle ? (
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3">{sectionTitle}</h3>
      ) : null}
      <div className="text-sm sm:text-base text-gray-300 leading-snug [&_a]:text-primary-300 [&_p]:my-2 [&_p]:leading-relaxed">
        <RichText value={description} className="[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal" />
      </div>
      {points && points.length > 0 ? (
        <ul
          className={`mt-4 space-y-2.5 text-sm sm:text-base text-gray-300 ${
            hasImage ? "text-left" : "inline-block text-left mx-auto max-w-lg"
          }`}>
          {points.map((p, i) => (
            <li key={`about-point-${i}`} className="flex gap-3 items-start">
              {hasAsset(p.icon) ? (
                <span className="relative mt-0.5 h-7 w-7 shrink-0 overflow-hidden">
                  <Image
                    src={urlFor(p.icon as SanityImageSource)
                      .width(64)
                      .height(64)
                      .url()}
                    alt=""
                    width={28}
                    height={28}
                    className="h-full w-full object-contain p-0.5"
                  />
                </span>
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" aria-hidden />
              )}
              <div className="min-w-0 flex-1 text-sm sm:text-base text-gray-300 [&_a]:text-primary-300 [&_p]:my-1 [&_p]:leading-relaxed">
                <RichText value={p.text} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  if (!hasImage) {
    return <div className="py-2">{content}</div>;
  }

  const imageEl = (
    <div className="w-full max-w-md lg:w-2/5 shrink-0 mx-auto lg:mx-0">
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5">
        <IdealImage image={image} alt={sectionTitle || "About"} className="w-full h-auto object-cover" />
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10 xl:gap-12 ${
        invertMobile ? "flex-col-reverse" : ""
      } ${invertDesktop ? "lg:flex-row-reverse" : ""}`}>
      {imageEl}
      <div className="w-full min-w-0 lg:w-3/5">{content}</div>
    </div>
  );
}
