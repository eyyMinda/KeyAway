import type { ReactNode } from "react";

type TrustPageHeroProps = {
  label: string;
  title: ReactNode;
  subtitle?: ReactNode;
  lastUpdated?: string;
};

export default function TrustPageHero({ label, title, subtitle, lastUpdated }: TrustPageHeroProps) {
  return (
    <div className="border-b border-[#2a475e] bg-[#16202d]">
      <div className="mx-auto max-w-360 px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="section-label mx-auto mb-4">{label}</div>
          <h1 className="section-title mb-4">{title}</h1>
          {lastUpdated ? <p className="mb-3 text-base text-[#8f98a0]">Last updated: {lastUpdated}</p> : null}
          {subtitle ? <p className="mx-auto max-w-3xl text-[#c6d4df]">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
