'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useWeb3 } from '@/components/providers/Web3Provider'

export default function Header() {
  const { isConnected, address, connect, disconnect } = useWeb3()
  const pathname = usePathname()

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/trades', label: 'Trades', icon: '💱' },
    { href: '/memory', label: 'Memory', icon: '💾' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IM</span>
            </div>
            <h1 className="text-xl font-bold text-white">Immortal AI</h1>
          </Link>

          {/* Navigation - Only show when connected */}
          {isConnected && (
            <nav className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 transition-colors ${
                    pathname === link.href
                      ? 'text-purple-400 font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline">Connected</span>
                </div>
                <div className="text-slate-300 text-sm font-mono hidden sm:block">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1 rounded-md text-sm transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-md font-medium transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isConnected && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900/80 backdrop-blur-sm">
          <nav className="container mx-auto px-4 py-3 flex justify-around">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center space-y-1 transition-colors ${
                  pathname === link.href
                    ? 'text-purple-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-xs">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
