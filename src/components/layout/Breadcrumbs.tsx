import Link from "next/link";

export interface Crumb {
  label: string;
  /** Omit on the current (last) crumb. */
  href?: string;
}

/** Visible breadcrumb trail. Keep items in sync with the page's BreadcrumbList JSON-LD. */
export default function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-xs text-neutral-100 ${className ?? ""}`}>
      <ol className="flex flex-wrap items-center gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-[#c6d4df]" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="mx-1.5 text-[#8f98a0]" aria-hidden>
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
