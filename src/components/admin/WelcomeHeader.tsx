"use client";

import { useSession } from "next-auth/react";

export default function WelcomeHeader() {
  const { data: session } = useSession();
  const name = session?.user?.username ?? session?.user?.name ?? session?.user?.email?.split("@")[0] ?? null;
  const firstName = name?.split(/\s+/)[0];

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
        {firstName ? `Welcome, ${firstName}` : "Welcome back"}
      </h2>
      <p className="mt-2 text-base sm:text-lg text-gray-600">Here&apos;s what needs your attention</p>
    </div>
  );
}
