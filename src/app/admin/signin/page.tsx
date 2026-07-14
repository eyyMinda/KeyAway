"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa";

function AdminSignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const errorParam = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(provider: string) {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError("Sign-in failed. Try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Admin sign in</h1>
        <p className="mt-2 text-sm text-gray-600">Use your approved GitHub account to access the dashboard.</p>

        {(errorParam || error) && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error ?? "Sign-in failed. Try again or contact support."}
          </p>
        )}

        <button
          type="button"
          onClick={() => handleSignIn("github")}
          disabled={isLoading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#24292f] px-4 py-3 cursor-pointer text-sm font-medium text-white transition hover:bg-[#1b1f23] disabled:cursor-not-allowed disabled:opacity-70">
          <FaGithub className="h-5 w-5" />
          {isLoading ? "Redirecting to GitHub..." : "Sign in with GitHub"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Loading sign in...</p>
        </div>
      }>
      <AdminSignInForm />
    </Suspense>
  );
}
