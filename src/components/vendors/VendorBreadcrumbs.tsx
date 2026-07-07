import Breadcrumbs from "@/src/components/layout/Breadcrumbs";
import { buildVendorBreadcrumbItems } from "@/src/lib/seo/breadcrumbs";

type VendorBreadcrumbsProps = {
  vendor: { name: string };
  className?: string;
};

export default function VendorBreadcrumbs({ vendor, className }: VendorBreadcrumbsProps) {
  return <Breadcrumbs className={className} items={buildVendorBreadcrumbItems(vendor)} />;
}
