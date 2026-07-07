import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/src/sanity/lib/image";
import type { VendorListItem } from "@/src/lib/vendors/getVendors";

const HOMEPAGE_VENDOR_LIMIT = 10;

type HomeVendorBrowseProps = {
  vendors: VendorListItem[];
  position?: "top" | "bottom";
};

/** Compact vendor logo strip — rendered inside the popular programs section. */
export default function HomeVendorBrowse({ vendors, position = "bottom" }: HomeVendorBrowseProps) {
  const items = vendors.slice(0, HOMEPAGE_VENDOR_LIMIT);
  if (items.length === 0) return null;

  return (
    <div className={`text-center ${position === "top" ? "mb-10" : "mt-10"}`}>
      <h3 className="mb-5 text-xl font-semibold text-[#c6d4df] sm:mb-6 sm:text-2xl">
        Browse by <span className="text-gradient-pro">Vendor</span>
      </h3>

      <ul className="flex flex-wrap items-stretch justify-center gap-2.5 sm:gap-3">
        {items.map(vendor => (
          <li key={vendor._id}>
            <Link
              href={`/vendors/${vendor.slug}`}
              className="card-base group flex w-24 flex-col items-center rounded-sm px-2 py-3 transition-colors hover:border-[#4a90c4] sm:w-32 sm:px-2.5 sm:py-3.5">
              <div className="mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border border-[#2a475e] bg-[#0e1621] sm:h-16 sm:w-16">
                {vendor.logo ? (
                  <Image
                    src={urlFor(vendor.logo).width(96).height(96).fit("max").url()}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-contain p-1"
                    aria-hidden
                  />
                ) : (
                  <span className="text-base font-bold text-[#66c0f4]" aria-hidden>
                    {vendor.name.charAt(0)}
                  </span>
                )}
              </div>
              <span className="line-clamp-2 min-h-8 text-center text-xs font-semibold leading-tight text-[#c6d4df] group-hover:text-white sm:min-h-9 sm:text-xs">
                {vendor.name}
              </span>
              <span className="mt-0.5 text-xs text-[#8f98a0] group-hover:text-neutral-100">
                {vendor.programCount} {vendor.programCount === 1 ? "program" : "programs"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/vendors"
        className="mt-5 inline-block text-base font-semibold text-[#66c0f4] transition-colors hover:text-white sm:mt-6 sm:text-lg">
        View all vendors →
      </Link>
    </div>
  );
}
