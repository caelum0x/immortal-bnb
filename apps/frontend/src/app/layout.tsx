/**
 * Root Layout for Immortal AI Trading Bot Frontend
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Immortal AI Trading Bot',
  description: 'Autonomous AI trading bot for BNB Chain with immortal memory on Greenfield',
  keywords: ['AI', 'trading', 'BNB', 'blockchain', 'DeFi', 'PancakeSwap'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
