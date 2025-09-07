export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-12 py-6 text-center text-sm text-gray-600">
      <p>
        Made with ❤️ using Next.js & Sanity |
        <a href="https://github.com/eyyMinda" className="text-blue-600 hover:underline ml-1">
          GitHub
        </a>
      </p>
      <a
        href="https://www.buymeacoffee.com/eyyMinda"
        target="_blank"
        className="mt-2 inline-block bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500">
        ☕ Buy Me a Coffee
      </a>
    </footer>
  );
}
