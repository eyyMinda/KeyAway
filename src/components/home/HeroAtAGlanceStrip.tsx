import { homeAtAGlanceBullets, homeAtAGlanceIconShell } from "@/src/components/home/homeAtAGlanceBullets";

interface HeroAtAGlanceStripProps {
  stripId?: string;
  navLabel?: string;
}

export function HeroAtAGlanceStrip({ stripId = "at-a-glance", navLabel = "Product highlights" }: HeroAtAGlanceStripProps) {
  return (
    <div id={stripId} className="relative z-10 border-t border-[#2a475e] bg-[#16202d]/95 backdrop-blur-sm">
      <nav aria-label={navLabel} className="mx-auto w-full max-w-360">
        <ul className="m-0 grid list-none grid-cols-2 gap-px bg-[#2a475e] p-0 sm:grid-cols-3">
          {homeAtAGlanceBullets.map(({ icon: Icon, title, color }, index) => (
            <li
              key={title}
              className={`flex items-center justify-center gap-2 bg-[#16202d] px-3 py-2.5 sm:px-4 sm:py-2.5 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border ${homeAtAGlanceIconShell[color]}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 truncate text-left text-xs font-semibold leading-tight text-[#c6d4df] sm:text-[13px]">
                {title}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
