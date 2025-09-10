"use client";

import { ReactNode } from "react";

interface ModalSectionProps {
  title: string;
  color: "blue" | "green" | "red" | "purple" | "gray";
  children: ReactNode;
  className?: string;
}

const colorConfig = {
  blue: {
    bar: "bg-blue-500",
    title: "text-blue-700",
    background: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-100",
    content: "border-blue-200"
  },
  green: {
    bar: "bg-green-500",
    title: "text-green-700",
    background: "bg-gradient-to-br from-green-50 to-emerald-50",
    border: "border-green-100",
    content: "border-green-200"
  },
  red: {
    bar: "bg-red-500",
    title: "text-red-700",
    background: "bg-gradient-to-br from-red-50 to-pink-50",
    border: "border-red-100",
    content: "border-red-200"
  },
  purple: {
    bar: "bg-purple-500",
    title: "text-purple-700",
    background: "bg-gradient-to-br from-purple-50 to-indigo-50",
    border: "border-purple-100",
    content: "border-purple-200"
  },
  gray: {
    bar: "bg-gray-500",
    title: "text-gray-700",
    background: "bg-gradient-to-br from-gray-50 to-slate-50",
    border: "border-gray-100",
    content: "border-gray-200"
  }
};

export default function ModalSection({ title, color, children, className = "" }: ModalSectionProps) {
  const config = colorConfig[color];

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
