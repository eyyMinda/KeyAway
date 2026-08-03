import Link from "next/link";

type FeedShowMoreButtonProps = {
  href: string;
  label?: string;
};

export default function FeedShowMoreButton({ href, label = "Load more" }: FeedShowMoreButtonProps) {
  return (
    <div className="mt-8 flex justify-center">
      <Link
        href={href}
        scroll={false}
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-6 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors hover:border-[#66c0f4] hover:bg-[#213246] hover:text-white">
        {label}
      </Link>
    </div>
  );
}
