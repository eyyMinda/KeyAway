"use client";

import { ReactNode } from "react";
import { modalSectionStyles } from "@/src/theme/colorSchema";

interface ModalSectionProps {
  title: string;
  color: "blue" | "green" | "red" | "purple" | "gray";
  children: ReactNode;
  className?: string;
}

export default function ModalSection({ title, color, children, className = "" }: ModalSectionProps) {
  const config = modalSectionStyles[color];

  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <div className={`w-1 h-6 ${config.bar} rounded-full mr-3`}></div>
        {title}
      </h3>
      <div className={`${config.background} rounded-xl p-6 border ${config.border}`}>{children}</div>
    </div>
  );
}
