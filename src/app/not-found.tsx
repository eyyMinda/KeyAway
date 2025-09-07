import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Program Not Found</h1>
      <p className="text-gray-600 mb-6">Sorry, we couldn’t find the program you’re looking for.</p>
      <Link href="/" className="text-blue-600 hover:underline">
        Go back home
      </Link>
    </main>
  );
}
