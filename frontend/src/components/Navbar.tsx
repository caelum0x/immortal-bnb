export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b-2 border-black">
      <div className="mx-auto max-w-[95vw] px-2">
        <div className="flex h-10 md:h-14 items-center justify-between font-bold">
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <span className="text-2xl mr-2">🤖</span>
              <span className="text-lg">IMMORTAL AI BOT</span>
              <span className="ml-2 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded">
                🧬 EVOLVING
              </span>
            </a>
          </div>

          <div className="hidden items-end space-x-6 md:flex md:absolute md:left-1/2 md:-translate-x-1/2">
            <a
              className="font-mono text-sm text-gray-900 hover:text-blue-600 transition-colors"
              href="/"
            >
              🌐 CROSS-CHAIN
            </a>
            <span className="text-gray-900">|</span>
            <a
              className="font-mono text-sm text-gray-900 hover:text-purple-600 transition-colors"
              href="/"
            >
              🧠 AI AGENT
            </a>
            <span className="text-gray-900">|</span>
            <span
              className="font-mono text-sm text-gray-400 cursor-not-allowed relative group"
            >
              🚀 STRATEGIES
              <span className="absolute left-1/2 -translate-x-1/2 top-full mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap">
                Evolving automatically
              </span>
            </span>
            <span className="text-gray-900">|</span>
            <span
              className="font-mono text-sm text-gray-400 cursor-not-allowed relative group"
            >
              BLOG
              <span className="absolute left-1/2 -translate-x-1/2 top-full mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap">
                Coming soon
              </span>
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
