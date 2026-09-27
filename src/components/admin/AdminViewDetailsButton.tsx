"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export const adminViewDetailsButtonClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700";

export default function AdminViewDetailsButton({
  children = "View Details",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  return (
    <button type={type} className={`${adminViewDetailsButtonClass} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
