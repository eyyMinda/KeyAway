import type { Crumb } from "@/src/components/layout/Breadcrumbs";
import type { Program } from "@/src/types/program";

type ProgramBreadcrumbSource = Pick<Program, "title" | "slug" | "vendor">;

export function buildProgramBreadcrumbItems(program: Pick<Program, "title" | "vendor">): Crumb[] {
  return [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs" },
    ...(program.vendor ? [{ label: program.vendor.name, href: `/vendors/${program.vendor.slug}` }] : []),
    { label: program.title }
  ];
}

export function buildVendorBreadcrumbItems(vendor: { name: string }): Crumb[] {
  return [
    { label: "Home", href: "/" },
    { label: "Vendors", href: "/vendors" },
    { label: vendor.name }
  ];
}

/** BreadcrumbList block for program page JSON-LD — keep in sync with buildProgramBreadcrumbItems(). */
export function buildProgramBreadcrumbJsonLd(program: ProgramBreadcrumbSource, base: string, pageUrl: string) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Programs", item: `${base}/programs` },
      ...(program.vendor
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: program.vendor.name,
              item: `${base}/vendors/${program.vendor.slug}`
            }
          ]
        : []),
      {
        "@type": "ListItem",
        position: program.vendor ? 4 : 3,
        name: program.title,
        item: pageUrl
      }
    ]
  };
}
