import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Web3Provider from '@/components/providers/Web3Provider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Immortal AI Trading Bot',
  description: 'AI-powered trading bot for BNB Chain with immortal memory',
  keywords: ['AI Trading', 'BNB Chain', 'DeFi', 'PancakeSwap', 'Automated Trading'],
  authors: [{ name: 'Immortal AI Team' }],
  openGraph: {
    title: 'Immortal AI Trading Bot',
    description: 'AI-powered trading bot for BNB Chain with immortal memory',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <Web3Provider>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
              {children}
            </div>
          </Web3Provider>
        </QueryProvider>
      </body>
    </html>
  )
}
